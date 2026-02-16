use crate::protocol::types::Color;

const TEXT_SEPARATOR: [u8; 4] = [0x05, 0xFF, 0xFF, 0xFF];
const IMAGE_WIDTH: usize = 16;
const IMAGE_HEIGHT: usize = 32;

pub struct TextOptions {
    pub bitmaps: Vec<u8>,
    pub text_mode: u8,
    pub speed: u8,
    pub text_color_mode: u8,
    pub text_color: Color,
    pub text_bg_mode: u8,
    pub text_bg_color: Color,
}

impl Default for TextOptions {
    fn default() -> Self {
        Self {
            bitmaps: Vec::new(),
            text_mode: 1,
            speed: 95,
            text_color_mode: 1,
            text_color: Color::new(255, 0, 0),
            text_bg_mode: 0,
            text_bg_color: Color::new(0, 0, 0),
        }
    }
}

pub fn build_text_packet(opts: &TextOptions) -> Vec<u8> {
    // Count separators in bitmaps to get num_chars
    let mut num_chars: u16 = 0;
    if opts.bitmaps.len() >= 4 {
        for i in 0..=opts.bitmaps.len() - 4 {
            if opts.bitmaps[i] == 0x05
                && opts.bitmaps[i + 1] == 0xFF
                && opts.bitmaps[i + 2] == 0xFF
                && opts.bitmaps[i + 3] == 0xFF
            {
                num_chars += 1;
            }
        }
    }

    // Build metadata (14 bytes)
    let mut metadata = vec![0u8; 14];
    metadata[0..2].copy_from_slice(&num_chars.to_le_bytes());
    metadata[2] = 0x00;
    metadata[3] = 0x01;
    metadata[4] = opts.text_mode;
    metadata[5] = opts.speed;
    metadata[6] = opts.text_color_mode;
    metadata[7] = opts.text_color.r;
    metadata[8] = opts.text_color.g;
    metadata[9] = opts.text_color.b;
    metadata[10] = opts.text_bg_mode;
    metadata[11] = opts.text_bg_color.r;
    metadata[12] = opts.text_bg_color.g;
    metadata[13] = opts.text_bg_color.b;

    // Combine metadata + bitmaps
    let mut packet = metadata;
    packet.extend_from_slice(&opts.bitmaps);

    // Build header (16 bytes)
    let total_len = 16 + packet.len();
    let packet_crc = crc32fast::hash(&packet);

    let mut header = vec![0u8; 16];
    header[0..2].copy_from_slice(&(total_len as u16).to_le_bytes());
    header[2] = 0x03;
    header[3] = 0x00;
    header[4] = 0x00;
    header[5..9].copy_from_slice(&(packet.len() as u32).to_le_bytes());
    header[9..13].copy_from_slice(&packet_crc.to_le_bytes());
    header[13] = 0x00;
    header[14] = 0x00;
    header[15] = 0x0C;

    // Combine header + packet
    let mut result = header;
    result.extend(packet);
    result
}

/// Render a single character to a 16x32 monochrome bitmap.
/// Returns separator + bitmap bytes.
///
/// Each row: 16 pixels packed into 2 bytes, LSB first within each byte.
/// Total: 32 rows * 2 bytes = 64 bytes per character.
pub fn render_char_bitmap(pixels: &[u8]) -> Vec<u8> {
    let mut bitmap = vec![0u8; IMAGE_WIDTH * IMAGE_HEIGHT / 8];
    let mut byte_index = 0;
    let mut current_byte: u8 = 0;

    for y in 0..IMAGE_HEIGHT {
        for x in 0..IMAGE_WIDTH {
            if x % 8 == 0 {
                current_byte = 0;
            }
            let pixel = pixels.get(y * IMAGE_WIDTH + x).copied().unwrap_or(0);
            current_byte |= (pixel & 1) << (x % 8);
            if x % 8 == 7 || x == IMAGE_WIDTH - 1 {
                bitmap[byte_index] = current_byte;
                byte_index += 1;
            }
        }
    }

    let mut result = Vec::with_capacity(TEXT_SEPARATOR.len() + bitmap.len());
    result.extend_from_slice(&TEXT_SEPARATOR);
    result.extend(bitmap);
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_render_char_bitmap_empty() {
        let pixels = vec![0u8; IMAGE_WIDTH * IMAGE_HEIGHT];
        let result = render_char_bitmap(&pixels);
        assert_eq!(result.len(), 4 + 64); // separator + bitmap
        assert_eq!(&result[0..4], &TEXT_SEPARATOR);
        assert!(result[4..].iter().all(|&b| b == 0));
    }

    #[test]
    fn test_render_char_bitmap_first_pixel() {
        let mut pixels = vec![0u8; IMAGE_WIDTH * IMAGE_HEIGHT];
        pixels[0] = 1; // top-left pixel
        let result = render_char_bitmap(&pixels);
        assert_eq!(result[4], 0x01); // LSB set
    }

    #[test]
    fn test_build_text_packet_header() {
        let bitmaps = render_char_bitmap(&vec![0u8; IMAGE_WIDTH * IMAGE_HEIGHT]);
        let opts = TextOptions {
            bitmaps,
            ..Default::default()
        };
        let result = build_text_packet(&opts);

        // Header checks
        assert_eq!(result[2], 0x03);
        assert_eq!(result[3], 0x00);
        assert_eq!(result[4], 0x00);
        assert_eq!(result[13], 0x00);
        assert_eq!(result[14], 0x00);
        assert_eq!(result[15], 0x0C);

        // Metadata: num_chars = 1
        assert_eq!(result[16], 1);
        assert_eq!(result[17], 0);
    }
}
