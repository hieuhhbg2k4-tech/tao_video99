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

### Bước 3: Dựng Composition Remotion (`templates/PlateAuctionProVideo.tsx`, `templates/Plate3DVideo.tsx` hoặc `templates/SimSaleVideo.tsx`)
Khởi tạo project Remotion với `remotion`, `@remotion/cli`, `@remotion/captions`, `@remotion/media`, `@remotion/three`, `three`, `@react-three/fiber`, `react`, `react-dom`:
- **Bản Chuyên Biển Đấu Giá (`templates/PlateAuctionProVideo.tsx` + `assets/trung_dau_gia.jpg` + `assets/sfx_*.wav`):** Khuyên dùng cho video bán biển số xe:
  1. **Mở đầu Split-Screen trên nền lưới tối (`0.0s – 2.4s`):** Bên trái là ảnh **TRÚNG ĐẤU GIÁ** (`trung_dau_gia.jpg`) tự động thay biển số động ở ô giữa; ở giữa có nút tròn `VIP`; bên phải là khung video viền vàng phát sáng; phía dưới có nút CTA vàng **`NHẮN TIN “QUAN TÂM”`**.
  2. **Mở rộng toàn màn hình (`2.4s – 3.0s`):** Khung video phóng to mượt ra toàn màn hình `720x1280` kèm tiếng `sfx_whoosh.wav`.
  3. **Khung TRÚNG ĐẤU GIÁ lơ lửng 3D phía trên đầu (`3.0s+`):** Đậu gọn ở vùng 1/3 trên, nghiêng 3D nhẹ nhàng và tự động đổi màu từng con số trên biển đúng nhịp nói + tiếng `sfx_ding.wav` / `sfx_slam.wav`.
- **Bản Biển Số Kể Chuyện 3D (`templates/PlateStoryVideo.tsx`) — MẶC ĐỊNH KHUYÊN DÙNG cho biển số:** Mở đầu Split-Screen `TRÚNG ĐẤU GIÁ` → mở toàn màn hình → biển số 3D Three.js + kim cương xoay. **Chỉ cần sửa khối `CONFIG`** ở đầu file:
  - `plateTop`, `plateBottom`, `videoSrc`, `introTitle/introTag/introCta`.
  - `beats[]`: mỗi lần người nói giải nghĩa 1 con số → `{from, to, digitIdx, big, label, color}`; số đó trên biển 3D phát sáng đúng màu + thẻ `BeatCard` (số to + ý nghĩa) bật vào + tiếng `ding` + camera đập nhẹ.
  - `plateRevealAt/To` (lúc đọc cả biển → toàn biển rực sáng + slam), `storyPill`, `askPill`, `priceAt/priceText` (đóng dấu giá + shimmer).
  - Cắt bỏ phần thừa cuối video (VD câu "thôi tắt đi") bằng cách đặt `durationInFrames` của Composition kết thúc trước đoạn đó.
  - `overlayTop`: 350 (thẻ ngay dưới biển) — nếu người nói quay **sát mặt**, đặt ~860 để thẻ nằm trên vùng ngực, không che mặt.
  - `videoFilter`: video quay **tối/ban đêm** → `'brightness(1.35) contrast(1.08) saturate(1.12)'`.
  - Video nói liền mạch không ngắt nghỉ → chia thời gian từng chữ theo **số âm tiết** (số biển đọc dài hơn: `30L`=3, `029.29`=5).
  - Luôn ghi file `.tsx/.json` có tiếng Việt bằng **Python (UTF-8)**, không dùng `Get-Content/Set-Content` của PowerShell (sẽ lỗi font).
- **Bản 3D Three.js (`templates/Plate3DVideo.tsx` + `assets/sfx_*.wav`):** Dùng khối 3D Three.js xoay + kim cương 3D.
- **Bản 2D (`templates/SimSaleVideo.tsx`):** Dùng cho video bán SIM cần gọn nhẹ, nhanh.

### Bước 4: Render & kiểm tra kết quả
1. Chạy render:
   ```bash
   npx remotion render src/index.ts SimSaleVideo "<output-path>.mp4"
   ```
2. Cắt 2–3 khung hình từ video đã render để kiểm tra trực quan bố cục chữ, thẻ giá và xác nhận không che mặt người nói.
