---
name: tao_video99
description: Skill lên kịch bản & edit video dọc 9:16 (TikTok/Reels/Shorts) bán SIM số đẹp và Biển số xe đẹp bằng Remotion; hỗ trợ phân tích hàng loạt video, tự động tách lời thoại tiếng Việt, căn nhịp âm thanh, chèn phụ đề bút dạ quang, thẻ số/biển bật theo nhịp nói, pop-up giá tiền đóng dấu + shimmer và CTA chốt đơn.
version: "1.1"
metadata:
  tags: remotion, video, sim, bien-so, tiktok, reels, captions, vietnamese, pricing
---

# tao_video99 — Lên Kịch Bản & Edit Video Bán SIM / Biển Số Đẹp (Remotion)

Skill này đóng gói quy trình tự động phân tích video mẫu, nghĩ kịch bản và edit video quay dọc (`9:16`, ví dụ `720x1280` hoặc `1080x1920`) cho cả **SIM số đẹp** và **Biển số xe đẹp** bằng **Remotion**.

## Khi nào sử dụng
Kích hoạt skill này khi người dùng:
- Gửi 1 hoặc **hàng loạt video (VD: 10–20 video)** trong một thư mục để đọc/phân tích phong cách nói, câu từ chốt đơn, rồi **nghĩ kịch bản mới** cho cả **SIM** lẫn **Biển số xe**.
- Yêu cầu **lên kịch bản quay video ngắn (15–30s)** theo đúng cấu trúc dễ dựng hiệu ứng.
- Gửi file `.mp4` quay thô và yêu cầu edit nhấn mạnh câu từ, bộ số/biển số, giá tiền và CTA chốt đơn.

## Quy trình thực hiện

### Bước 0: Nghĩ kịch bản quay video (khi người dùng chưa có video hoặc muốn lên kịch bản mới)
Khi người dùng cung cấp **số SIM, giá bán, điểm mạnh** (hoặc chỉ nói chủ đề), viết ngay **kịch bản 15–20 giây** chia 4 nhịp chuẩn để khớp với các lớp hiệu ứng Remotion:
1. **Hook (0–2s):** Câu mở đầu giữ chân + gợi ý banner tiêu đề (VD: `🔥 LÊN SÓNG SIM ĐẸP GIÁ TỐT 🔥`).
2. **Thân bài — Tách cụm số & ý nghĩa (2–10s):** Chia số SIM thành 2–3 cụm dễ đọc (VD: đầu số / cụm giữa / đuôi tam hoa, tứ quý) kèm ý nghĩa phong thủy ngắn gọn để khớp `NumberChip` bật từng cụm.
3. **Điểm rơi giá & cam kết (10–13s):** Câu đọc giá rõ ràng (VD: *"để giao lưu 5 củ thôi, vào tên chính chủ"*) để khớp hiệu ứng **đóng dấu giá + shimmer** và **typewriter**.
4. **CTA chốt đơn (13–16s):** Kêu gọi hành động ngắn gọn (VD: *"Anh em nào chốt inbox ngay cho mình!"*).
- Trình bày kèm bảng: **Mốc giây | Lời thoại gợi ý | Hiệu ứng chữ/giá sẽ chèn khi edit**.

### Bước 1: Kiểm tra video đầu vào & trích xuất khung hình
- Kiểm tra thông số video (`width`, `height`, `fps`, `duration`) và cắt 3–4 khung hình mẫu bằng `cv2` để xác định vùng trống trên đầu (đặt thẻ số/giá) và vùng áo/ngực phía dưới (đặt phụ đề để không che mặt).

### Bước 2: Tách âm thanh & nhận diện lời thoại tiếng Việt
1. Dùng `ffmpeg.exe` đi kèm trong `@remotion/compositor-win32-x64-msvc` để tách âm thanh chuẩn `16kHz mono WAV`:
   ```bash
   ffmpeg.exe -y -i source.mp4 -ar 16000 -ac 1 audio.wav
   ```
2. Tách lời thoại tiếng Việt (ví dụ bằng Python `SpeechRecognition` với `language='vi-VN'`) kết hợp phân tích biên độ năng lượng RMS theo từng cửa sổ `100ms` từ `audio.wav` để xác định chính xác mốc thời gian (`startMs`, `endMs`) của từng cụm từ, con số và mức giá.
3. Xuất danh sách token ra `src/captions.json` theo định dạng `Caption[]` của `@remotion/captions`.

### Bước 3: Dựng Composition Remotion (`templates/SimSaleVideo.tsx` hoặc `templates/Plate3DVideo.tsx`)
Khởi tạo project Remotion với `remotion`, `@remotion/cli`, `@remotion/captions`, `@remotion/media`, `@remotion/three`, `three`, `@react-three/fiber`, `react`, `react-dom`:
- **Bản 2D (`templates/SimSaleVideo.tsx`):** Dùng cho video bán SIM cần gọn nhẹ, nhanh.
- **Bản 3D PRO (`templates/Plate3DVideo.tsx` + `assets/sfx_*.wav`):** Khuyên dùng để giữ chân người xem tối đa:
  1. **Ninja Entrance (`0.0s – 1.8s`):** Snap-zoom đột ngột (`1.24 -> 1.0`), lóe sáng trắng, banner lao vút vào khung hình + tiếng `sfx_whoosh.wav`.
  2. **Biển số / Thẻ số 3D (`<ThreeCanvas>`):** Dựng khối 3D viền vàng kim loại, bay từ xa xoay 360° vào vị trí (`z: -10 -> 0`) kèm 2 viên kim cương 3D quay hai bên; tự động đổi màu từng con số trên texture 3D đúng nhịp nói + tiếng `sfx_slam.wav` / `sfx_ding.wav`.
  3. **Camera động giữ chân (Dynamic Retention Camera):** Nhịp zoom nhẹ liên tục ở các mốc nhấn (`6.0s`, `10.7s`, `15.5s`, `29.9s`).
  4. **Thẻ Giá Tiền đóng dấu + Shimmer Sweep:** Phóng to rồi đóng dấu xuống (`scale 1.75 -> 1.0`) kèm vệt sáng nghiêng quét ngang và nút CTA chốt đơn.
  5. **Phụ đề TikTok Word-Highlight + Bút dạ quang:** Dùng `createTikTokStyleCaptions()` từ `@remotion/captions`; từ khóa quan trọng tự động được quét nền highlight từ trái sang phải.

### Bước 4: Render & kiểm tra kết quả
1. Chạy render:
   ```bash
   npx remotion render src/index.ts SimSaleVideo "<output-path>.mp4"
   ```
2. Cắt 2–3 khung hình từ video đã render để kiểm tra trực quan bố cục chữ, thẻ giá và xác nhận không che mặt người nói.
