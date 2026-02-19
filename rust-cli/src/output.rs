use serde::Serialize;

use crate::protocol::types::DiscoveredDevice;

#[derive(Serialize)]
pub struct ScanOutput {
    pub devices: Vec<DiscoveredDevice>,
}

#[derive(Serialize)]
pub struct SuccessOutput {
    pub success: bool,
    pub message: String,
}

#[derive(Serialize)]
pub struct PreviewOutput {
    pub preview: String,
    pub width: u32,
    pub height: u32,
    pub bytes: usize,
    pub format: String,
}

#[derive(Serialize)]
pub struct ProgressOutput {
    pub stage: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chunk: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_chunks: Option<usize>,
}

#[derive(Serialize)]
pub struct ErrorOutput {
    pub error: String,
}

pub fn print_json<T: Serialize>(value: &T) {
    println!("{}", serde_json::to_string(value).unwrap());
}

pub fn print_success(message: &str) {
    print_json(&SuccessOutput {
        success: true,
        message: message.to_string(),
    });
}

pub fn print_error(message: &str) {
    print_json(&ErrorOutput {
        error: message.to_string(),
    });
}

pub fn print_progress(stage: &str, message: Option<&str>, chunk: Option<usize>, total: Option<usize>) {
    print_json(&ProgressOutput {
        stage: stage.to_string(),
        message: message.map(|s| s.to_string()),
        chunk,
        total_chunks: total,
    });
}
