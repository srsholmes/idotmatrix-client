use image::codecs::gif::{GifEncoder, Repeat};
use image::imageops::FilterType;
use image::{
    AnimationDecoder, DynamicImage, Frame, GenericImageView, ImageFormat, Rgba, RgbaImage,
};
use std::error::Error;
use std::fs;
use std::io::Cursor;
use std::path::Path;
use std::time::Duration;

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

    let mut buf = Vec::new();
    {
        let mut encoder = GifEncoder::new_with_speed(&mut buf, 10);
        encoder.set_repeat(Repeat::Infinite)?;

        for frame in &frames {
            let img = DynamicImage::ImageRgba8(frame.buffer().clone());
            let resized = contain_resize(&img, size);
            let delay = frame.delay();
            let new_frame = Frame::from_parts(resized.to_rgba8(), 0, 0, delay);
            encoder.encode_frame(new_frame)?;
        }
    }
    Ok(buf)
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
    let mut buf = Vec::new();
    {
        let mut encoder = GifEncoder::new_with_speed(&mut buf, 10);
        encoder.set_repeat(Repeat::Infinite)?;

        for img_data in images {
            let img = image::load_from_memory(img_data)?;
            let resized = contain_resize(&img, size);
            let delay = image::Delay::from_saturating_duration(Duration::from_millis(delay_ms as u64));
            let frame = Frame::from_parts(resized.to_rgba8(), 0, 0, delay);
            encoder.encode_frame(frame)?;
        }
    }
    Ok(buf)
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

/// Encode a single image as a GIF.
fn encode_single_gif(img: &DynamicImage) -> Result<Vec<u8>, Box<dyn Error>> {
    let mut buf = Vec::new();
    {
        let mut encoder = GifEncoder::new(&mut buf);
        encoder.set_repeat(Repeat::Infinite)?;
        let frame = Frame::new(img.to_rgba8());
        encoder.encode_frame(frame)?;
    }
    Ok(buf)
}
