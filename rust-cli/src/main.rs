mod cli;
mod imaging;
mod output;
mod protocol;
mod transport;

use base64::Engine;
use clap::Parser;
use log::{error, info};
use std::path::Path;
use std::process;
use tokio::time::{sleep, Duration};

use cli::{
    CarouselAction, Cli, ClockAction, Commands, GifAction, ImageAction, ScreenAction,
};
use imaging::{fetch_image, is_url};
use output::{print_error, print_json, print_progress, print_success, PreviewOutput, ScanOutput};
use protocol::commands::{
    chronograph, clock, common, countdown, effect, fullscreen_color, gif, graffiti,
    scoreboard, text,
};
use protocol::types::Color;
use transport::ble::BtleplugTransport;

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    let json = cli.json;

    if cli.verbose {
        env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();
    } else {
        env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("warn")).init();
    }

    if let Err(e) = run(cli).await {
        let msg = format!("{}", e);
        eprintln!("[idm] fatal error: {}", msg);
        if json {
            // Ensure JSON error is always printed to stdout so the frontend can parse it
            print_error(&msg);
        }
        process::exit(1);
    }
}

/// Helper to print a message either as JSON or plain text
fn msg(json: bool, message: &str) {
    eprintln!("[idm] result: {}", message);
    if json {
        print_success(message);
    } else {
        println!("{}", message);
    }
}

/// Helper to print an error either as JSON or plain text, then return Err
fn err(json: bool, message: &str) -> Result<(), Box<dyn std::error::Error>> {
    if json {
        print_error(message);
    } else {
        eprintln!("Error: {}", message);
    }
    Err(message.into())
}

async fn run(cli: Cli) -> Result<(), Box<dyn std::error::Error>> {
    let json = cli.json;
    eprintln!("[idm] json={}, address={:?}", json, cli.address);

    match cli.command {
        Commands::Scan { timeout } => cmd_scan(timeout, json).await,
        Commands::Screen { action } => {
            let mut t = connect(&cli.address, json).await?;
            let result = cmd_screen(&t, action, json).await;
            safe_disconnect(&mut t).await;
            result
        }
        Commands::Color { hex } => {
            let mut t = connect(&cli.address, json).await?;
            let color = Color::from_hex(&hex);
            t.write(&fullscreen_color::set_fullscreen_color(color), false)
                .await?;
            msg(json, &format!("Color set to #{}", hex));
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::Image { action } => cmd_image(&cli.address, action, json).await,
        Commands::Gif { action } => cmd_gif(&cli.address, action, json).await,
        Commands::Clock { action } => {
            let mut t = connect(&cli.address, json).await?;
            let result = cmd_clock(&t, action, json).await;
            safe_disconnect(&mut t).await;
            result
        }
        Commands::Countdown {
            action,
            minutes,
            seconds,
        } => {
            let mode = match action.as_str() {
                "disable" => 0,
                "start" => 1,
                "pause" => 2,
                "restart" => 3,
                _ => {
                    return err(json, "Invalid action. Use: start, pause, restart, disable");
                }
            };
            let mut t = connect(&cli.address, json).await?;
            t.write(
                &countdown::set_countdown_mode(mode, minutes, seconds),
                false,
            )
            .await?;
            msg(json, &format!("Countdown {} ({}m {}s)", action, minutes, seconds));
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::Chronograph { action } => {
            let mode = match action.as_str() {
                "reset" => 0,
                "start" => 1,
                "pause" => 2,
                "continue" => 3,
                _ => {
                    return err(json, "Invalid action. Use: reset, start, pause, continue");
                }
            };
            let mut t = connect(&cli.address, json).await?;
            t.write(&chronograph::set_chronograph_mode(mode), false)
                .await?;
            msg(json, &format!("Chronograph {}", action));
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::Scoreboard { score1, score2 } => {
            let mut t = connect(&cli.address, json).await?;
            t.write(&scoreboard::set_scoreboard(score1, score2), false)
                .await?;
            msg(json, &format!("Scoreboard: {} - {}", score1, score2));
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::Pixel { x, y, hex } => {
            let color = Color::from_hex(&hex);
            let mut t = connect(&cli.address, json).await?;
            t.write(&graffiti::set_pixel(x, y, color), false).await?;
            msg(json, &format!("Pixel set at ({}, {}) to #{}", x, y, hex));
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::Reset => {
            let mut t = connect(&cli.address, json).await?;
            for packet in common::reset() {
                t.write(&packet, false).await?;
            }
            msg(json, "Device reset");
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::Carousel { action } => cmd_carousel(&cli.address, action, json).await,
        Commands::Effect { style, colors } => {
            let parsed_colors: Vec<Color> = colors.iter().map(|h| Color::from_hex(h)).collect();
            let mut t = connect(&cli.address, json).await?;
            t.write(&effect::set_effect(style, &parsed_colors), false)
                .await?;
            msg(json, &format!("Effect set (style={})", style));
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::Speed { value } => {
            let mut t = connect(&cli.address, json).await?;
            t.write(&common::set_speed(value), false).await?;
            msg(json, &format!("Speed set to {}", value));
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::Password { value } => {
            let mut t = connect(&cli.address, json).await?;
            t.write(&common::set_password(value), false).await?;
            msg(json, "Password set");
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::TimeIndicator { state } => {
            let enabled = match state.as_str() {
                "on" | "true" | "1" => true,
                "off" | "false" | "0" => false,
                _ => return err(json, "Invalid state. Use: on, off"),
            };
            let mut t = connect(&cli.address, json).await?;
            t.write(&clock::set_time_indicator(enabled), false).await?;
            msg(json, &format!("Time indicator {}", if enabled { "on" } else { "off" }));
            safe_disconnect(&mut t).await;
            Ok(())
        }
        Commands::Text {
            message,
            mode,
            speed,
            color_mode,
            color,
            bg_mode,
            bg_color,
            font_size,
        } => {
            let text_color = Color::from_hex(&color);
            let text_bg_color = Color::from_hex(&bg_color);

            if !json {
                println!("Rendering text: \"{}\"", message);
            }
            let bitmaps = text::render_text(&message, font_size)?;

            let opts = text::TextOptions {
                bitmaps,
                text_mode: mode,
                speed,
                text_color_mode: color_mode,
                text_color,
                text_bg_mode: bg_mode,
                text_bg_color,
            };
            let packet = text::build_text_packet(&opts);

            let mut t = connect(&cli.address, json).await?;
            t.write(&packet, true).await?;
            msg(json, "Text sent");
            safe_disconnect(&mut t).await;
            Ok(())
        }
    }
}

/// Disconnect from BLE device, ignoring errors.
/// On macOS, btleplug's CoreBluetooth disconnect often produces a harmless
/// event channel cleanup error. Since the command already succeeded, we
/// don't want this to cause a JSON error that confuses the frontend.
async fn safe_disconnect(transport: &mut BtleplugTransport) {
    if let Err(e) = transport.disconnect().await {
        eprintln!("[idm] disconnect warning (harmless): {}", e);
    }
}

async fn connect(
    address: &Option<String>,
    json: bool,
) -> Result<BtleplugTransport, Box<dyn std::error::Error>> {
    let address = match address.as_ref() {
        Some(a) => a,
        None => {
            let msg = "Device address required. Use --address or set IDOTMATRIX_ADDRESS env var.";
            eprintln!("[idm] error: {}", msg);
            return Err(msg.into());
        }
    };
    eprintln!("[idm] connecting to {}...", address);
    let mut transport = BtleplugTransport::new();
    transport.connect(address).await?;
    eprintln!("[idm] connected to {}", address);
    Ok(transport)
}

async fn cmd_scan(timeout: u64, json: bool) -> Result<(), Box<dyn std::error::Error>> {
    if !json {
        println!("Scanning for iDotMatrix devices ({} ms)...", timeout);
    }
    let transport = BtleplugTransport::new();
    let devices = transport.scan(timeout).await?;

    if json {
        print_json(&ScanOutput { devices });
    } else if devices.is_empty() {
        println!("No devices found.");
    } else {
        for d in &devices {
            println!(
                "  {} (address: {}, RSSI: {})",
                d.name,
                d.address,
                d.rssi.map_or("N/A".to_string(), |r| r.to_string())
            );
        }
        println!("Found {} device(s).", devices.len());
    }
    Ok(())
}

async fn cmd_screen(
    t: &BtleplugTransport,
    action: ScreenAction,
    json: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        ScreenAction::On => {
            t.write(&common::screen_on(), false).await?;
            msg(json, "Screen on");
        }
        ScreenAction::Off => {
            t.write(&common::screen_off(), false).await?;
            msg(json, "Screen off");
        }
        ScreenAction::Flip { state } => {
            let on = match state.to_lowercase().as_str() {
                "on" => true,
                "off" => false,
                _ => {
                    let m = format!("Invalid flip state '{}': use 'on' or 'off'", state);
                    if json {
                        print_error(&m);
                    } else {
                        eprintln!("{}", m);
                    }
                    std::process::exit(1);
                }
            };
            t.write(&common::flip_screen(on), false).await?;
            msg(json, &format!("Screen flip: {}", if on { "on" } else { "off" }));
        }
        ScreenAction::Brightness { percent } => {
            t.write(&common::set_brightness(percent), false).await?;
            msg(json, &format!("Brightness set to {}%", percent.clamp(5, 100)));
        }
        ScreenAction::Freeze => {
            t.write(&common::freeze_screen(), false).await?;
            msg(json, "Screen freeze toggled");
        }
    }
    Ok(())
}

async fn cmd_clock(
    t: &BtleplugTransport,
    action: ClockAction,
    json: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        ClockAction::Set {
            style,
            color,
            no_date,
            twelve_hour,
        } => {
            let c = Color::from_hex(&color);
            t.write(
                &clock::set_clock_mode(style, c, !no_date, !twelve_hour),
                false,
            )
            .await?;
            msg(json, &format!("Clock mode set (style={}, color=#{})", style, color));
        }
        ClockAction::Sync => {
            t.write(&common::set_time_now(), false).await?;
            msg(json, "Device time synced");
        }
    }
    Ok(())
}

async fn cmd_image(
    address: &Option<String>,
    action: ImageAction,
    json: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        ImageAction::Upload { source, size, raw } => {
            let data = load_source(&source, json).await?;
            let gif_data = if raw {
                data
            } else {
                if json {
                    print_progress("resizing", Some(&format!("Resizing image to {}x{}...", size, size)), None, None);
                } else {
                    println!("Resizing image to {}x{}...", size, size);
                }
                imaging::resize::resize_image_to_gif(&data, size as u32)?
            };

            let payloads = gif::create_gif_payloads(&gif_data);
            if !json {
                println!(
                    "Uploading image ({} bytes, {} chunks)...",
                    gif_data.len(),
                    payloads.len()
                );
            }

            let mut t = connect(address, json).await?;
            for (i, payload) in payloads.iter().enumerate() {
                info!("Sending chunk {}/{}", i + 1, payloads.len());
                if json {
                    print_progress("uploading", None, Some(i + 1), Some(payloads.len()));
                }
                t.write(payload, true).await?;
                sleep(Duration::from_millis(1000)).await;
            }
            msg(json, "Image uploaded");
            safe_disconnect(&mut t).await;
        }
        ImageAction::Preview {
            source,
            size,
            output,
        } => {
            let data = load_source(&source, json).await?;
            if json {
                // Return base64-encoded GIF for programmatic use
                let gif_data = imaging::resize::resize_image_to_gif(&data, size as u32)?;
                let b64 = base64::engine::general_purpose::STANDARD.encode(&gif_data);
                print_json(&PreviewOutput {
                    preview: b64,
                    width: size as u32,
                    height: size as u32,
                    bytes: gif_data.len(),
                    format: "gif".to_string(),
                });
            } else {
                let resized = imaging::resize::resize_image_to_png(&data, size as u32)?;
                std::fs::write(&output, &resized)?;
                println!("Preview saved to {}", output);
            }
        }
    }
    Ok(())
}

async fn cmd_gif(
    address: &Option<String>,
    action: GifAction,
    json: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        GifAction::Upload { source, size, raw } => {
            let data = load_source(&source, json).await?;
            let gif_data = if raw {
                data
            } else {
                if json {
                    print_progress("resizing", Some(&format!("Resizing GIF to {}x{}...", size, size)), None, None);
                } else {
                    println!("Resizing GIF to {}x{}...", size, size);
                }
                imaging::resize::resize_gif(&data, size as u32)?
            };

            let payloads = gif::create_gif_payloads(&gif_data);
            if !json {
                println!(
                    "Uploading GIF ({} bytes, {} chunks)...",
                    gif_data.len(),
                    payloads.len()
                );
            }

            let mut t = connect(address, json).await?;
            for (i, payload) in payloads.iter().enumerate() {
                info!("Sending chunk {}/{}", i + 1, payloads.len());
                if json {
                    print_progress("uploading", None, Some(i + 1), Some(payloads.len()));
                }
                t.write(payload, true).await?;
                sleep(Duration::from_millis(1000)).await;
            }
            msg(json, "GIF uploaded");
            safe_disconnect(&mut t).await;
        }
        GifAction::Preview {
            source,
            size,
            output,
        } => {
            let data = load_source(&source, json).await?;
            let gif_data = imaging::resize::resize_gif(&data, size as u32)?;
            if json {
                let b64 = base64::engine::general_purpose::STANDARD.encode(&gif_data);
                print_json(&PreviewOutput {
                    preview: b64,
                    width: size as u32,
                    height: size as u32,
                    bytes: gif_data.len(),
                    format: "gif".to_string(),
                });
            } else {
                std::fs::write(&output, &gif_data)?;
                println!("Preview saved to {}", output);
            }
        }
    }
    Ok(())
}

async fn cmd_carousel(
    address: &Option<String>,
    action: CarouselAction,
    json: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        CarouselAction::Upload {
            sources,
            size,
            delay,
        } => {
            if sources.len() < 2 {
                return err(json, "Carousel requires at least 2 images");
            }

            if !json {
                println!("Loading {} images...", sources.len());
            }
            let mut images = Vec::new();
            for source in &sources {
                images.push(load_source(source, json).await?);
            }

            if json {
                print_progress("resizing", Some(&format!("Creating carousel GIF ({}x{}, {}ms delay)...", size, size, delay)), None, None);
            } else {
                println!(
                    "Creating carousel GIF ({}x{}, {}ms delay)...",
                    size, size, delay
                );
            }
            let gif_data = imaging::resize::create_carousel(&images, size as u32, delay)?;

            let payloads = gif::create_gif_payloads(&gif_data);
            if !json {
                println!(
                    "Uploading carousel ({} bytes, {} chunks)...",
                    gif_data.len(),
                    payloads.len()
                );
            }

            let mut t = connect(address, json).await?;
            for (i, payload) in payloads.iter().enumerate() {
                info!("Sending chunk {}/{}", i + 1, payloads.len());
                if json {
                    print_progress("uploading", None, Some(i + 1), Some(payloads.len()));
                }
                t.write(payload, true).await?;
                sleep(Duration::from_millis(1000)).await;
            }
            msg(json, "Carousel uploaded");
            safe_disconnect(&mut t).await;
        }
    }
    Ok(())
}

async fn load_source(source: &str, json: bool) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if is_url(source) {
        if !json {
            println!("Downloading {}...", source);
        }
        fetch_image(source).await
    } else {
        Ok(std::fs::read(Path::new(source))?)
    }
}
