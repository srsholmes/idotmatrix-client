use color_quant::NeuQuant;
use image::imageops::FilterType;
use image::{AnimationDecoder, DynamicImage, GenericImageView, ImageFormat, Rgba, RgbaImage};
use std::error::Error;
use std::fs;
use std::io::Cursor;
use std::path::Path;

/// Load an image from a file path or buffer, resize with "contain" fit
/// (preserving aspect ratio, padding with black), and encode as GIF.
pub fn resize_image_to_gif(input: &[u8], size: u32) -> Result<Vec<u8>, Box<dyn Error>> {
    let img = image::load_from_memory(input)?;
    let resized = contain_resize(&img, size);
    encode_single_gif(&resized)
}

/// Load an image from a file path, resize, and encode as GIF.
pub fn resize_image_file_to_gif(path: &Path, size: u32) -> Result<Vec<u8>, Box<dyn Error>> {
    let data = fs::read(path)?;
    resize_image_to_gif(&data, size)
}

/// Load an image from a file path, resize with "contain" fit, and encode as PNG.
pub fn resize_image_to_png(input: &[u8], size: u32) -> Result<Vec<u8>, Box<dyn Error>> {
    let img = image::load_from_memory(input)?;
    let resized = contain_resize(&img, size);
    let mut buf = Vec::new();
    resized.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)?;
    Ok(buf)
}

/// Resize an animated GIF, preserving all frames.
pub fn resize_gif(input: &[u8], size: u32) -> Result<Vec<u8>, Box<dyn Error>> {
    let cursor = Cursor::new(input);
    let decoder = image::codecs::gif::GifDecoder::new(cursor)?;
    let frames = decoder.into_frames().collect_frames()?;

    // Resize all frames first
    let mut resized_frames: Vec<(RgbaImage, u16)> = Vec::new();
    for frame in &frames {
        let img = DynamicImage::ImageRgba8(frame.buffer().clone());
        let resized = contain_resize(&img, size);
        let (numer, denom) = frame.delay().numer_denom_ms();
        let delay_cs = ((numer as f64 / denom as f64) / 10.0).round() as u16;
        resized_frames.push((resized.to_rgba8(), delay_cs));
    }

    encode_animated_gif(&resized_frames, size)
}

/// Resize a GIF file, preserving animation.
pub fn resize_gif_file(path: &Path, size: u32) -> Result<Vec<u8>, Box<dyn Error>> {
    let data = fs::read(path)?;
    resize_gif(&data, size)
}

/// Create an animated GIF from multiple images with a given delay between frames.
pub fn create_carousel(
    images: &[Vec<u8>],
    size: u32,
    delay_ms: u32,
) -> Result<Vec<u8>, Box<dyn Error>> {
    let delay_cs = (delay_ms / 10) as u16;
    let mut resized_frames: Vec<(RgbaImage, u16)> = Vec::new();
    for img_data in images {
        let img = image::load_from_memory(img_data)?;
        let resized = contain_resize(&img, size);
        resized_frames.push((resized.to_rgba8(), delay_cs));
    }
    encode_animated_gif(&resized_frames, size)
}

/// Resize an image to fit within `size x size` while preserving aspect ratio.
/// The image is centered on a black background (contain fit).
fn contain_resize(img: &DynamicImage, size: u32) -> DynamicImage {
    let (w, h) = img.dimensions();
    let scale = (size as f64 / w as f64).min(size as f64 / h as f64);
    let new_w = (w as f64 * scale).round() as u32;
    let new_h = (h as f64 * scale).round() as u32;

    let resized = img.resize_exact(new_w, new_h, FilterType::Nearest);

    // Create black canvas
    let mut canvas = RgbaImage::from_pixel(size, size, Rgba([0, 0, 0, 255]));

    // Center the resized image on the canvas
    let offset_x = (size - new_w) / 2;
    let offset_y = (size - new_h) / 2;

    image::imageops::overlay(&mut canvas, &resized.to_rgba8(), offset_x as i64, offset_y as i64);

    DynamicImage::ImageRgba8(canvas)
}

/// Encode multiple RGBA frames as an animated GIF with a shared 256-color global palette.
/// The iDotMatrix device requires colors in the global color table.
fn encode_animated_gif(frames: &[(RgbaImage, u16)], size: u32) -> Result<Vec<u8>, Box<dyn Error>> {
    // Sample pixels from all frames to build a shared palette
    let all_pixels: Vec<u8> = frames
        .iter()
        .flat_map(|(img, _)| img.pixels().flat_map(|p| p.0))
        .collect();
    let nq = NeuQuant::new(1, 256, &all_pixels);
    let palette = nq.color_map_rgb();

    let mut buf = Vec::new();
    {
        let mut encoder = gif::Encoder::new(&mut buf, size as u16, size as u16, &palette)?;
        encoder.set_repeat(gif::Repeat::Infinite)?;

        for (img, delay_cs) in frames {
            let indices: Vec<u8> = img.pixels().map(|p| nq.index_of(&p.0) as u8).collect();
            let mut frame = gif::Frame::default();
            frame.width = size as u16;
            frame.height = size as u16;
            frame.delay = *delay_cs;
            frame.buffer = std::borrow::Cow::Owned(indices);
            encoder.write_frame(&frame)?;
        }
    }
    Ok(buf)
}

/// Encode a single image as a GIF with a proper 256-color global color table.
/// The iDotMatrix device requires colors in the global palette (not local).
fn encode_single_gif(img: &DynamicImage) -> Result<Vec<u8>, Box<dyn Error>> {
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();

    // Build RGBA pixel vector for NeuQuant (4 bytes per pixel)
    let pixels: Vec<u8> = rgba.pixels().flat_map(|p| p.0).collect();

    // Quantize to 256 colors
    let nq = NeuQuant::new(1, 256, &pixels);
    let palette = nq.color_map_rgb();

    // Map each pixel to its palette index
    let indices: Vec<u8> = rgba
        .pixels()
        .map(|p| nq.index_of(&p.0) as u8)
        .collect();

    // Encode using gif crate directly for a proper global color table
    let mut buf = Vec::new();
    {
        let mut encoder = gif::Encoder::new(&mut buf, width as u16, height as u16, &palette)?;
        encoder.set_repeat(gif::Repeat::Infinite)?;
        let mut frame = gif::Frame::default();
        frame.width = width as u16;
        frame.height = height as u16;
        frame.buffer = std::borrow::Cow::Borrowed(&indices);
        encoder.write_frame(&frame)?;
    }
    Ok(buf)
}
