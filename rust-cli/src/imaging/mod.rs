pub mod resize;

use std::error::Error;

pub fn is_url(input: &str) -> bool {
    input.starts_with("http://") || input.starts_with("https://")
}

pub fn fetch_image(url: &str) -> Result<Vec<u8>, Box<dyn Error>> {
    let response = reqwest::blocking::get(url)?;
    let bytes = response.bytes()?;
    Ok(bytes.to_vec())
}
