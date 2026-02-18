#[allow(dead_code)]
use crate::protocol::constants::IMAGE_CHUNK_SIZE;

#[allow(dead_code)]
const HEADER_SIZE: usize = 16;

#[allow(dead_code)]
pub fn set_image_mode(mode: u8) -> Vec<u8> {
    vec![5, 0, 4, 1, mode]
}

#[allow(dead_code)]
pub fn create_image_payloads(png_data: &[u8]) -> Vec<Vec<u8>> {
    let crc = crc32fast::hash(png_data);
    let chunks: Vec<&[u8]> = png_data.chunks(IMAGE_CHUNK_SIZE).collect();
    let mut payloads = Vec::new();

    for (i, chunk) in chunks.iter().enumerate() {
        let chunk_len = HEADER_SIZE + chunk.len();
        let mut payload = vec![0u8; chunk_len];

        // Header
        payload[0..2].copy_from_slice(&(chunk_len as u16).to_le_bytes());
        payload[2] = 0x01;
        payload[3] = 0x00;
        payload[4] = if i > 0 { 0x02 } else { 0x00 };
        payload[5..9].copy_from_slice(&(png_data.len() as u32).to_le_bytes());
        payload[9..13].copy_from_slice(&crc.to_le_bytes());
        payload[13] = 0x05;
        payload[14] = 0x00;
        payload[15] = 0x0D;

        // Data
        payload[HEADER_SIZE..].copy_from_slice(chunk);
        payloads.push(payload);
    }

    payloads
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_image_mode() {
        assert_eq!(set_image_mode(1), vec![5, 0, 4, 1, 1]);
    }

    #[test]
    fn test_create_image_payloads_single_chunk() {
        let data = vec![0xAA; 100];
        let payloads = create_image_payloads(&data);
        assert_eq!(payloads.len(), 1);

        let p = &payloads[0];
        assert_eq!(p.len(), 116); // 16 + 100

        // Check header
        let len = u16::from_le_bytes([p[0], p[1]]);
        assert_eq!(len, 116);
        assert_eq!(p[2], 0x01);
        assert_eq!(p[3], 0x00);
        assert_eq!(p[4], 0x00); // first chunk
        let total_len = u32::from_le_bytes([p[5], p[6], p[7], p[8]]);
        assert_eq!(total_len, 100);
        assert_eq!(p[13], 0x05);
        assert_eq!(p[14], 0x00);
        assert_eq!(p[15], 0x0D);

        // Check data
        assert_eq!(&p[16..], &[0xAA; 100]);
    }

    #[test]
    fn test_create_image_payloads_multi_chunk() {
        let data = vec![0xBB; 5000]; // > 4096
        let payloads = create_image_payloads(&data);
        assert_eq!(payloads.len(), 2);

        // First chunk: flag=0
        assert_eq!(payloads[0][4], 0x00);
        assert_eq!(payloads[0].len(), 16 + 4096);

        // Second chunk: flag=2
        assert_eq!(payloads[1][4], 0x02);
        assert_eq!(payloads[1].len(), 16 + 904);
    }
}
