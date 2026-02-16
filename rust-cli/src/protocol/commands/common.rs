use chrono::Datelike;
use chrono::Timelike;

pub fn freeze_screen() -> Vec<u8> {
    vec![4, 0, 3, 0]
}

pub fn screen_on() -> Vec<u8> {
    vec![5, 0, 7, 1, 1]
}

pub fn screen_off() -> Vec<u8> {
    vec![5, 0, 7, 1, 0]
}

pub fn flip_screen(flip: bool) -> Vec<u8> {
    vec![5, 0, 6, 128, if flip { 1 } else { 0 }]
}

pub fn set_brightness(percent: u8) -> Vec<u8> {
    let clamped = percent.clamp(5, 100);
    vec![5, 0, 4, 128, clamped]
}

pub fn set_speed(speed: u8) -> Vec<u8> {
    vec![5, 0, 3, 1, speed]
}

pub fn set_time_now() -> Vec<u8> {
    let now = chrono::Local::now();
    let year = (now.year() % 100) as u8;
    let month = now.month() as u8;
    let day = now.day() as u8;
    // chrono weekday: Mon=0..Sun=6. Protocol: 1=Mon..7=Sun
    let weekday = now.weekday().num_days_from_monday() as u8 + 1;
    let hour = now.hour() as u8;
    let minute = now.minute() as u8;
    let second = now.second() as u8;
    vec![11, 0, 1, 128, year, month, day, weekday, hour, minute, second]
}

pub fn set_password(password: u32) -> Vec<u8> {
    let pwd = password.min(999999);
    let high = (pwd / 10000) as u8;
    let mid = ((pwd / 100) % 100) as u8;
    let low = (pwd % 100) as u8;
    vec![8, 0, 4, 2, 1, high, mid, low]
}

pub fn reset() -> Vec<Vec<u8>> {
    vec![
        vec![0x04, 0x00, 0x03, 0x80],
        vec![0x05, 0x00, 0x04, 0x80, 0x50],
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_freeze_screen() {
        assert_eq!(freeze_screen(), vec![4, 0, 3, 0]);
    }

    #[test]
    fn test_screen_on() {
        assert_eq!(screen_on(), vec![5, 0, 7, 1, 1]);
    }

    #[test]
    fn test_screen_off() {
        assert_eq!(screen_off(), vec![5, 0, 7, 1, 0]);
    }

    #[test]
    fn test_flip_screen() {
        assert_eq!(flip_screen(true), vec![5, 0, 6, 128, 1]);
        assert_eq!(flip_screen(false), vec![5, 0, 6, 128, 0]);
    }

    #[test]
    fn test_set_brightness() {
        assert_eq!(set_brightness(50), vec![5, 0, 4, 128, 50]);
        assert_eq!(set_brightness(0), vec![5, 0, 4, 128, 5]);
        assert_eq!(set_brightness(200), vec![5, 0, 4, 128, 100]);
    }

    #[test]
    fn test_set_speed() {
        assert_eq!(set_speed(5), vec![5, 0, 3, 1, 5]);
    }

    #[test]
    fn test_set_password() {
        assert_eq!(set_password(123456), vec![8, 0, 4, 2, 1, 12, 34, 56]);
        assert_eq!(set_password(0), vec![8, 0, 4, 2, 1, 0, 0, 0]);
    }

    #[test]
    fn test_reset() {
        let packets = reset();
        assert_eq!(packets.len(), 2);
        assert_eq!(packets[0], vec![0x04, 0x00, 0x03, 0x80]);
        assert_eq!(packets[1], vec![0x05, 0x00, 0x04, 0x80, 0x50]);
    }
}
