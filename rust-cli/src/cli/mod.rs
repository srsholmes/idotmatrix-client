use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "idm", about = "iDotMatrix LED display controller", version)]
pub struct Cli {
    /// Device BLE address (or set IDOTMATRIX_ADDRESS env var)
    #[arg(short, long, env = "IDOTMATRIX_ADDRESS", global = true)]
    pub address: Option<String>,

    /// Enable verbose debug logging
    #[arg(short, long, global = true)]
    pub verbose: bool,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Scan for nearby iDotMatrix devices
    Scan {
        /// Scan timeout in milliseconds
        #[arg(long, default_value_t = 5000)]
        timeout: u64,
    },

    /// Control screen state
    Screen {
        #[command(subcommand)]
        action: ScreenAction,
    },

    /// Fill screen with a solid color
    Color {
        /// Hex color (e.g. ff0000 for red)
        hex: String,
    },

    /// Upload a static image
    Image {
        #[command(subcommand)]
        action: ImageAction,
    },

    /// Upload an animated GIF
    Gif {
        #[command(subcommand)]
        action: GifAction,
    },

    /// Clock display mode
    Clock {
        #[command(subcommand)]
        action: ClockAction,
    },

    /// Countdown timer
    Countdown {
        /// Action: start, pause, restart, disable
        action: String,
        /// Minutes
        #[arg(short, long, default_value_t = 0)]
        minutes: u8,
        /// Seconds
        #[arg(short, long, default_value_t = 0)]
        seconds: u8,
    },

    /// Chronograph (stopwatch)
    Chronograph {
        /// Action: reset, start, pause, continue
        action: String,
    },

    /// Display scoreboard
    Scoreboard {
        /// Score 1 (0-999)
        score1: u16,
        /// Score 2 (0-999)
        score2: u16,
    },

    /// Set a single pixel
    Pixel {
        /// X coordinate
        x: u8,
        /// Y coordinate
        y: u8,
        /// Hex color (e.g. 00ff00 for green)
        hex: String,
    },

    /// Reset device to defaults
    Reset,

    /// Create animated GIF from multiple images
    Carousel {
        #[command(subcommand)]
        action: CarouselAction,
    },

    /// Display visual effect
    Effect {
        /// Effect style (0-6): 0=horizontal rainbow, 1=random pixels, 2=random white, 3=vertical rainbow, 4=diagonal right, 5=diagonal left, 6=random colored
        #[arg(long, default_value_t = 0)]
        style: u8,
        /// Colors as hex values (2-7 colors, e.g. ff0000 00ff00)
        colors: Vec<String>,
    },

    /// Set animation/display speed
    Speed {
        /// Speed value
        value: u8,
    },

    /// Set device password
    Password {
        /// Password (0-999999)
        value: u32,
    },

    /// Toggle time indicator on clock
    TimeIndicator {
        /// Enable or disable (on/off)
        state: String,
    },

    /// Display scrolling text
    Text {
        /// Text to display
        message: String,
        /// Text mode (0-8): 0=replace, 1=marquee, 2=reversed, 3=rise, 4=lower, 5=blink, 6=fade, 7=tetris, 8=fill
        #[arg(long, default_value_t = 1)]
        mode: u8,
        /// Scroll speed (0-255)
        #[arg(long, default_value_t = 95)]
        speed: u8,
        /// Text color mode (0-5): 0=white, 1=custom, 2-5=rainbow modes
        #[arg(long, default_value_t = 1)]
        color_mode: u8,
        /// Text color hex (e.g. ff0000)
        #[arg(long, default_value = "ff0000")]
        color: String,
        /// Background mode (0=black, 1=custom)
        #[arg(long, default_value_t = 0)]
        bg_mode: u8,
        /// Background color hex (e.g. 000000)
        #[arg(long, default_value = "000000")]
        bg_color: String,
        /// Font size in pixels
        #[arg(long, default_value_t = 24)]
        font_size: u32,
    },
}

#[derive(Subcommand)]
pub enum ScreenAction {
    /// Turn display on
    On,
    /// Turn display off
    Off,
    /// Flip display 180 degrees
    Flip {
        /// Disable flip (set upright)
        #[arg(long)]
        no_flip: bool,
    },
    /// Set brightness (5-100%)
    Brightness {
        /// Brightness percentage
        percent: u8,
    },
    /// Toggle screen freeze
    Freeze,
}

#[derive(Subcommand)]
pub enum ImageAction {
    /// Upload image to display
    Upload {
        /// Image file path or URL
        source: String,
        /// Display size (32 or 64)
        #[arg(short, long, default_value_t = 32)]
        size: u8,
        /// Skip resize, send raw
        #[arg(long)]
        raw: bool,
    },
    /// Preview resized image locally
    Preview {
        /// Image file path or URL
        source: String,
        /// Display size (32 or 64)
        #[arg(short, long, default_value_t = 32)]
        size: u8,
        /// Output file path
        #[arg(short, long, default_value = "preview.png")]
        output: String,
    },
}

#[derive(Subcommand)]
pub enum GifAction {
    /// Upload animated GIF to display
    Upload {
        /// GIF file path or URL
        source: String,
        /// Display size (32 or 64)
        #[arg(short, long, default_value_t = 32)]
        size: u8,
        /// Skip resize, send raw
        #[arg(long)]
        raw: bool,
    },
    /// Preview resized GIF locally
    Preview {
        /// GIF file path or URL
        source: String,
        /// Display size (32 or 64)
        #[arg(short, long, default_value_t = 32)]
        size: u8,
        /// Output file path
        #[arg(short, long, default_value = "preview.gif")]
        output: String,
    },
}

#[derive(Subcommand)]
pub enum ClockAction {
    /// Set clock display mode
    Set {
        /// Clock style (0-7)
        #[arg(long, default_value_t = 0)]
        style: u8,
        /// Color in hex (e.g. ffffff)
        #[arg(long, default_value = "ffffff")]
        color: String,
        /// Hide date display
        #[arg(long)]
        no_date: bool,
        /// Use 12-hour format
        #[arg(long, name = "12h")]
        twelve_hour: bool,
    },
    /// Sync device time to system time
    Sync,
}

#[derive(Subcommand)]
pub enum CarouselAction {
    /// Upload multiple images as animated GIF
    Upload {
        /// Image file paths or URLs (minimum 2)
        sources: Vec<String>,
        /// Display size (32 or 64)
        #[arg(short, long, default_value_t = 32)]
        size: u8,
        /// Delay between frames in milliseconds
        #[arg(short, long, default_value_t = 3000)]
        delay: u32,
    },
}
