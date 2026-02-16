use crate::protocol::constants::{GIF_CHUNK_SIZE, GIF_HEADER_SIZE};

pub fn create_gif_payloads(gif_data: &[u8]) -> Vec<Vec<u8>> {
    let crc = crc32fast::hash(gif_data);
    let chunks: Vec<&[u8]> = gif_data.chunks(GIF_CHUNK_SIZE).collect();
    let mut payloads = Vec::new();

    for (i, chunk) in chunks.iter().enumerate() {
        let chunk_len = GIF_HEADER_SIZE + chunk.len();
        let mut payload = vec![0u8; chunk_len];

        // Header
        payload[0..2].copy_from_slice(&(chunk_len as u16).to_le_bytes());
        payload[2] = 0x01;
        payload[3] = 0x00;
        payload[4] = if i > 0 { 0x02 } else { 0x00 };
        payload[5..9].copy_from_slice(&(gif_data.len() as u32).to_le_bytes());
        payload[9..13].copy_from_slice(&crc.to_le_bytes());
        payload[13] = 0x05;
        payload[14] = 0x00;
        payload[15] = 0x0D;

        // Data
        payload[GIF_HEADER_SIZE..].copy_from_slice(chunk);
        payloads.push(payload);
    }

    payloads
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_gif_payloads_single_chunk() {
        let data = vec![0xCC; 200];
        let payloads = create_gif_payloads(&data);
        assert_eq!(payloads.len(), 1);
        assert_eq!(payloads[0].len(), 216);
        assert_eq!(payloads[0][4], 0x00);
    }

    #[test]
    fn test_create_gif_payloads_multi_chunk() {
        let data = vec![0xDD; 8200];
        let payloads = create_gif_payloads(&data);
        assert_eq!(payloads.len(), 3);
        assert_eq!(payloads[0][4], 0x00);
        assert_eq!(payloads[1][4], 0x02);
        assert_eq!(payloads[2][4], 0x02);
    }
}
