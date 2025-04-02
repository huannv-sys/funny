# Kết nối với thiết bị MikroTik thực

Hướng dẫn này mô tả cách để kết nối ứng dụng với thiết bị MikroTik thực thay vì sử dụng dữ liệu giả lập.

## Thiết lập biến môi trường

Để kết nối với thiết bị MikroTik, bạn cần cung cấp các thông tin sau:

- `MIKROTIK_HOST`: Địa chỉ IP của thiết bị MikroTik (ví dụ: 192.168.88.1)
- `MIKROTIK_USER`: Tên đăng nhập (thường là admin)
- `MIKROTIK_PASS`: Mật khẩu

Các biến môi trường này đã được cấu hình trong Replit.

## Kiểm tra kết nối

Để kiểm tra kết nối với thiết bị MikroTik trước khi chạy ứng dụng chính, bạn có thể sử dụng script kiểm tra nâng cao:

```bash
node advanced_test_connection.cjs
```

Script này sẽ thử kết nối qua các cổng API phổ biến (8728 và 8729) và cung cấp thông tin chi tiết về lỗi nếu có.

Nếu kết nối thành công, bạn sẽ thấy thông tin về thiết bị và danh sách các giao diện mạng.

## Chạy ứng dụng với kết nối thực

Để chạy ứng dụng với kết nối thiết bị thực, sử dụng script `start_real_connection.sh`:

```bash
./start_real_connection.sh
```

Script này sẽ đặt biến môi trường `USE_MOCK_DATA=false` và khởi động ứng dụng.

## Xử lý sự cố

Nếu bạn gặp lỗi khi kết nối:

1. Kiểm tra lại địa chỉ IP, tên người dùng và mật khẩu
2. Đảm bảo thiết bị MikroTik đang hoạt động và có thể truy cập từ mạng hiện tại
3. Kiểm tra xem API trên thiết bị MikroTik đã được bật:
   - Đăng nhập vào Web interface của RouterOS (http://IP_ADDRESS)
   - Vào IP → Services
   - Đảm bảo rằng dịch vụ "api" và "api-ssl" đang được bật
4. Đảm bảo các cổng API (8728 và 8729) đã được mở trên thiết bị MikroTik
5. Nếu bạn đang kết nối qua VPN hoặc mạng công cộng, hãy kiểm tra tường lửa và các quy tắc NAT 
6. Thử sử dụng winbox để kết nối trước, sau đó kết nối API

### Lỗi phổ biến:

- **Timeout**: Thiết bị không thể truy cập được từ mạng của bạn hoặc cổng API bị chặn
- **Invalid username or password**: Thông tin đăng nhập không chính xác
- **Connection refused**: Dịch vụ API không được bật hoặc đang chạy trên cổng khác

## Quay lại chế độ giả lập

Nếu muốn quay lại sử dụng dữ liệu giả lập, chỉ cần chạy ứng dụng bình thường:

```bash
npm run dev
```

Hoặc đặt biến môi trường `USE_MOCK_DATA=true` trước khi chạy.