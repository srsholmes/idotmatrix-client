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
