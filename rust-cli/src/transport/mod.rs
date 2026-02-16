pub mod ble;

use crate::protocol::types::DiscoveredDevice;
use std::error::Error;

#[allow(async_fn_in_trait)]
pub trait BleTransport {
    async fn scan(&self, timeout_ms: u64) -> Result<Vec<DiscoveredDevice>, Box<dyn Error>>;
    async fn connect(&mut self, address: &str) -> Result<(), Box<dyn Error>>;
    async fn disconnect(&mut self) -> Result<(), Box<dyn Error>>;
    async fn write(&self, data: &[u8], with_response: bool) -> Result<(), Box<dyn Error>>;
    fn is_connected(&self) -> bool;
}
