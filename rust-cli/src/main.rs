mod cli;
mod imaging;
mod protocol;
mod transport;

use clap::Parser;
use log::{error, info};
use std::path::Path;
use std::process;
use tokio::time::{sleep, Duration};

use cli::{
    CarouselAction, Cli, ClockAction, Commands, GifAction, ImageAction, ScreenAction,
};
use imaging::{fetch_image, is_url};
use protocol::commands::{
    chronograph, clock, common, countdown, fullscreen_color, gif, graffiti, image,
    scoreboard,
};
use protocol::types::Color;
use transport::ble::BtleplugTransport;

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    if cli.verbose {
        env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();
    } else {
        env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("warn")).init();
    }

    if let Err(e) = run(cli).await {
        error!("{}", e);
        eprintln!("Error: {}", e);
        process::exit(1);
    }
}

async fn run(cli: Cli) -> Result<(), Box<dyn std::error::Error>> {
    match cli.command {
        Commands::Scan { timeout } => cmd_scan(timeout).await,
        Commands::Screen { action } => {
            let mut t = connect(&cli.address).await?;
            let result = cmd_screen(&t, action).await;
            t.disconnect().await?;
            result
        }
        Commands::Color { hex } => {
            let mut t = connect(&cli.address).await?;
            let color = Color::from_hex(&hex);
            t.write(&fullscreen_color::set_fullscreen_color(color), false)
                .await?;
            println!("Color set to #{}", hex);
            t.disconnect().await?;
            Ok(())
        }
        Commands::Image { action } => cmd_image(&cli.address, action).await,
        Commands::Gif { action } => cmd_gif(&cli.address, action).await,
        Commands::Clock { action } => {
            let mut t = connect(&cli.address).await?;
            let result = cmd_clock(&t, action).await;
            t.disconnect().await?;
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
                    return Err(
                        "Invalid action. Use: start, pause, restart, disable".into(),
                    )
                }
            };
            let mut t = connect(&cli.address).await?;
            t.write(
                &countdown::set_countdown_mode(mode, minutes, seconds),
                false,
            )
            .await?;
            println!("Countdown {} ({}m {}s)", action, minutes, seconds);
            t.disconnect().await?;
            Ok(())
        }
        Commands::Chronograph { action } => {
            let mode = match action.as_str() {
                "reset" => 0,
                "start" => 1,
                "pause" => 2,
                "continue" => 3,
                _ => {
                    return Err(
                        "Invalid action. Use: reset, start, pause, continue".into(),
                    )
                }
            };
            let mut t = connect(&cli.address).await?;
            t.write(&chronograph::set_chronograph_mode(mode), false)
                .await?;
            println!("Chronograph {}", action);
            t.disconnect().await?;
            Ok(())
        }
        Commands::Scoreboard { score1, score2 } => {
            let mut t = connect(&cli.address).await?;
            t.write(&scoreboard::set_scoreboard(score1, score2), false)
                .await?;
            println!("Scoreboard: {} - {}", score1, score2);
            t.disconnect().await?;
            Ok(())
        }
        Commands::Pixel { x, y, hex } => {
            let color = Color::from_hex(&hex);
            let mut t = connect(&cli.address).await?;
            t.write(&graffiti::set_pixel(x, y, color), false).await?;
            println!("Pixel set at ({}, {}) to #{}", x, y, hex);
            t.disconnect().await?;
            Ok(())
        }
        Commands::Reset => {
            let mut t = connect(&cli.address).await?;
            for packet in common::reset() {
                t.write(&packet, false).await?;
            }
            println!("Device reset");
            t.disconnect().await?;
            Ok(())
        }
        Commands::Carousel { action } => cmd_carousel(&cli.address, action).await,
    }
}

async fn connect(
    address: &Option<String>,
) -> Result<BtleplugTransport, Box<dyn std::error::Error>> {
    let address = address
        .as_ref()
        .ok_or("Device address required. Use --address or set IDOTMATRIX_ADDRESS env var.")?;
    let mut transport = BtleplugTransport::new();
    transport.connect(address).await?;
    Ok(transport)
}

async fn cmd_scan(timeout: u64) -> Result<(), Box<dyn std::error::Error>> {
    println!("Scanning for iDotMatrix devices ({} ms)...", timeout);
    let transport = BtleplugTransport::new();
    let devices = transport.scan(timeout).await?;

    if devices.is_empty() {
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
) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        ScreenAction::On => {
            t.write(&common::screen_on(), false).await?;
            println!("Screen on");
        }
        ScreenAction::Off => {
            t.write(&common::screen_off(), false).await?;
            println!("Screen off");
        }
        ScreenAction::Flip { no_flip } => {
            t.write(&common::flip_screen(!no_flip), false).await?;
            println!("Screen flip: {}", if no_flip { "off" } else { "on" });
        }
        ScreenAction::Brightness { percent } => {
            t.write(&common::set_brightness(percent), false).await?;
            println!("Brightness set to {}%", percent.clamp(5, 100));
        }
        ScreenAction::Freeze => {
            t.write(&common::freeze_screen(), false).await?;
            println!("Screen freeze toggled");
        }
    }
    Ok(())
}

async fn cmd_clock(
    t: &BtleplugTransport,
    action: ClockAction,
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
            println!("Clock mode set (style={}, color=#{})", style, color);
        }
        ClockAction::Sync => {
            t.write(&common::set_time_now(), false).await?;
            println!("Device time synced");
        }
    }
    Ok(())
}

async fn cmd_image(
    address: &Option<String>,
    action: ImageAction,
) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        ImageAction::Upload { source, size, raw } => {
            let data = load_source(&source)?;
            let gif_data = if raw {
                data
            } else {
                println!("Resizing image to {}x{}...", size, size);
                imaging::resize::resize_image_to_gif(&data, size as u32)?
            };

            let payloads = image::create_image_payloads(&gif_data);
            println!(
                "Uploading image ({} bytes, {} chunks)...",
                gif_data.len(),
                payloads.len()
            );

            let mut t = connect(address).await?;
            for (i, payload) in payloads.iter().enumerate() {
                info!("Sending chunk {}/{}", i + 1, payloads.len());
                t.write(payload, true).await?;
                if i < payloads.len() - 1 {
                    sleep(Duration::from_millis(1000)).await;
                }
            }
            println!("Image uploaded.");
            t.disconnect().await?;
        }
        ImageAction::Preview {
            source,
            size,
            output,
        } => {
            let data = load_source(&source)?;
            let resized = imaging::resize::resize_image_to_png(&data, size as u32)?;
            std::fs::write(&output, &resized)?;
            println!("Preview saved to {}", output);
        }
    }
    Ok(())
}

async fn cmd_gif(
    address: &Option<String>,
    action: GifAction,
) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        GifAction::Upload { source, size, raw } => {
            let data = load_source(&source)?;
            let gif_data = if raw {
                data
            } else {
                println!("Resizing GIF to {}x{}...", size, size);
                imaging::resize::resize_gif(&data, size as u32)?
            };

            let payloads = gif::create_gif_payloads(&gif_data);
            println!(
                "Uploading GIF ({} bytes, {} chunks)...",
                gif_data.len(),
                payloads.len()
            );

            let mut t = connect(address).await?;
            for (i, payload) in payloads.iter().enumerate() {
                info!("Sending chunk {}/{}", i + 1, payloads.len());
                t.write(payload, true).await?;
                if i < payloads.len() - 1 {
                    sleep(Duration::from_millis(1000)).await;
                }
            }
            println!("GIF uploaded.");
            t.disconnect().await?;
        }
        GifAction::Preview {
            source,
            size,
            output,
        } => {
            let data = load_source(&source)?;
            let resized = imaging::resize::resize_gif(&data, size as u32)?;
            std::fs::write(&output, &resized)?;
            println!("Preview saved to {}", output);
        }
    }
    Ok(())
}

async fn cmd_carousel(
    address: &Option<String>,
    action: CarouselAction,
) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        CarouselAction::Upload {
            sources,
            size,
            delay,
        } => {
            if sources.len() < 2 {
                return Err("Carousel requires at least 2 images".into());
            }

            println!("Loading {} images...", sources.len());
            let mut images = Vec::new();
            for source in &sources {
                images.push(load_source(source)?);
            }

            println!(
                "Creating carousel GIF ({}x{}, {}ms delay)...",
                size, size, delay
            );
            let gif_data = imaging::resize::create_carousel(&images, size as u32, delay)?;

            let payloads = gif::create_gif_payloads(&gif_data);
            println!(
                "Uploading carousel ({} bytes, {} chunks)...",
                gif_data.len(),
                payloads.len()
            );

            let mut t = connect(address).await?;
            for (i, payload) in payloads.iter().enumerate() {
                info!("Sending chunk {}/{}", i + 1, payloads.len());
                t.write(payload, true).await?;
                if i < payloads.len() - 1 {
                    sleep(Duration::from_millis(1000)).await;
                }
            }
            println!("Carousel uploaded.");
            t.disconnect().await?;
        }
    }
    Ok(())
}

fn load_source(source: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if is_url(source) {
        println!("Downloading {}...", source);
        fetch_image(source)
    } else {
        Ok(std::fs::read(Path::new(source))?)
    }
}
