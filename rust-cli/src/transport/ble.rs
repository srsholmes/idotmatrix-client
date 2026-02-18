use btleplug::api::{
    Central, Manager as _, Peripheral as _, ScanFilter, WriteType,
};
use btleplug::platform::{Adapter, Manager, Peripheral};
use log::debug;
use std::error::Error;
use std::time::Duration;
use tokio::time::sleep;
use uuid::Uuid;

use crate::protocol::constants::{BLE_DELAY_MS, DEVICE_NAME_PREFIX, UUID_READ_DATA, UUID_WRITE_DATA};
use crate::protocol::types::DiscoveredDevice;

const CONNECT_TIMEOUT_MS: u64 = 15000;

pub struct BtleplugTransport {
    peripheral: Option<Peripheral>,
    write_uuid: Uuid,
    read_uuid: Uuid,
    connected: bool,
}

impl BtleplugTransport {
    pub fn new() -> Self {
        Self {
            peripheral: None,
            write_uuid: Uuid::parse_str(UUID_WRITE_DATA).unwrap(),
            read_uuid: Uuid::parse_str(UUID_READ_DATA).unwrap(),
            connected: false,
        }
    }

    async fn get_adapter() -> Result<Adapter, Box<dyn Error>> {
        let manager = Manager::new().await?;
        let adapters = manager.adapters().await?;
        adapters
            .into_iter()
            .next()
            .ok_or_else(|| "No Bluetooth adapters found".into())
    }

    pub async fn scan(&self, timeout_ms: u64) -> Result<Vec<DiscoveredDevice>, Box<dyn Error>> {
        let adapter = Self::get_adapter().await?;
        adapter.start_scan(ScanFilter::default()).await?;

        sleep(Duration::from_millis(timeout_ms)).await;

        let peripherals = adapter.peripherals().await?;
        let mut devices = Vec::new();

        for p in peripherals {
            if let Some(props) = p.properties().await? {
                if let Some(name) = &props.local_name {
                    if name.starts_with(DEVICE_NAME_PREFIX) {
                        devices.push(DiscoveredDevice {
                            address: props.address.to_string(),
                            name: name.clone(),
                            rssi: props.rssi,
                        });
                    }
                }
            }
        }

        adapter.stop_scan().await?;
        Ok(devices)
    }

    pub async fn connect(&mut self, address: &str) -> Result<(), Box<dyn Error>> {
        let adapter = Self::get_adapter().await?;
        adapter.start_scan(ScanFilter::default()).await?;

        let target = address.to_lowercase();
        let deadline = tokio::time::Instant::now() + Duration::from_millis(CONNECT_TIMEOUT_MS);

        loop {
            if tokio::time::Instant::now() > deadline {
                adapter.stop_scan().await?;
                return Err(format!("Connection timeout: device {} not found", address).into());
            }

            let peripherals = adapter.peripherals().await?;
            for p in peripherals {
                if let Some(props) = p.properties().await? {
                    let addr_match = props.address.to_string().to_lowercase() == target;
                    let name_match = props
                        .local_name
                        .as_ref()
                        .map(|n| n.to_lowercase() == target)
                        .unwrap_or(false);

                    if addr_match || name_match {
                        adapter.stop_scan().await?;
                        debug!("Found device, connecting...");
                        p.connect().await?;
                        p.discover_services().await?;

                        // Verify write characteristic exists
                        let chars = p.characteristics();
                        let has_write = chars.iter().any(|c| c.uuid == self.write_uuid);
                        if !has_write {
                            return Err("Write characteristic not found".into());
                        }

                        let has_read = chars.iter().any(|c| c.uuid == self.read_uuid);
                        debug!(
                            "Found {} characteristics, write={}, read={}",
                            chars.len(),
                            has_write,
                            has_read
                        );

                        self.peripheral = Some(p);
                        self.connected = true;
                        debug!("Connected to {}", address);
                        return Ok(());
                    }
                }
            }

            sleep(Duration::from_millis(200)).await;
        }
    }

    pub async fn disconnect(&mut self) -> Result<(), Box<dyn Error>> {
        if let Some(ref p) = self.peripheral {
            if self.connected {
                p.disconnect().await?;
                debug!("Disconnected");
            }
        }
        self.connected = false;
        self.peripheral = None;
        Ok(())
    }

    pub async fn write(&self, data: &[u8], with_response: bool) -> Result<(), Box<dyn Error>> {
        let peripheral = self
            .peripheral
            .as_ref()
            .ok_or("Not connected")?;

        let chars = peripheral.characteristics();
        let write_char = chars
            .iter()
            .find(|c| c.uuid == self.write_uuid)
            .ok_or("Write characteristic not found")?;

        let write_type = if with_response {
            WriteType::WithResponse
        } else {
            WriteType::WithoutResponse
        };

        // Split large payloads into MTU-sized BLE writes.
        // macOS CoreBluetooth typically negotiates 512-byte MTU.
        // The device reassembles chunks using the length field in the protocol header.
        let max_write_size = 509; // MTU(512) - 3 ATT overhead

        if data.len() <= max_write_size {
            debug!(
                "Writing {} bytes (with_response={})",
                data.len(),
                with_response
            );
            peripheral
                .write(write_char, data, write_type)
                .await?;
        } else {
            let total_chunks = (data.len() + max_write_size - 1) / max_write_size;
            debug!(
                "Writing {} bytes in {} BLE chunks (with_response={})",
                data.len(),
                total_chunks,
                with_response
            );
            for chunk in data.chunks(max_write_size) {
                peripheral
                    .write(write_char, chunk, write_type)
                    .await?;
                let delay_ms = if with_response { BLE_DELAY_MS } else { 50 };
                sleep(Duration::from_millis(delay_ms)).await;
            }
        }

        sleep(Duration::from_millis(BLE_DELAY_MS)).await;
        Ok(())
    }

}
