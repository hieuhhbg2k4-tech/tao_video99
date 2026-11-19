# tao_video99 — AI Skill Lên Kịch Bản & Edit Video Bán SIM / Biển Số Đẹp (Remotion 3D)

Skill dành cho AI Agent (**Antigravity**, **Claude Code**, **Cursor**) giúp tự động:
1. **Lên kịch bản quay 15–30s** cho SIM số đẹp & Biển số xe đẹp (chia 4 nhịp: Hook → Tách số & phong thủy → Điểm rơi giá → CTA).
2. **Tách lời thoại tiếng Việt & căn timestamp** theo biên độ âm thanh.
3. **Edit & render video dọc 9:16 bằng Remotion + Three.js**:
   - **Ninja Entrance:** Snap-zoom đột ngột, lóe sáng, banner lao vút vào + âm thanh *whoosh*.
   - **Biển số / Thẻ số 3D (`Plate3DVideo.tsx`):** Khối 3D viền vàng kim loại xoay nổi khối, phát sáng từng con số đúng nhịp nói + kim cương 3D xoay hai bên.
   - **Thẻ Giá Tiền đóng dấu + Shimmer:** Phóng to đóng dấu xuống kèm vệt sáng quét ngang + typewriter cam kết chính chủ.
   - **Phụ đề bút dạ quang (TikTok Word-Highlight):** Tự động tô nền từ khóa quan trọng theo giọng nói.
   - **SFX đi kèm (`assets/`):** `sfx_whoosh.wav`, `sfx_slam.wav`, `sfx_ding.wav`.

---

## Cấu trúc repo

```text
tao_video99/
├── SKILL.md                  # Hướng dẫn chính cho AI Agent
├── README.md
├── .gitignore
├── templates/
│   ├── Plate3DVideo.tsx      # Template 3D PRO (Three.js + SFX + Dynamic Camera)
│   └── SimSaleVideo.tsx      # Template 2D gọn nhẹ cho SIM số đẹp
└── assets/
    ├── sfx_whoosh.wav        # Tiếng chém gió khi vào
    ├── sfx_slam.wav          # Tiếng bass slam khi đóng dấu biển/giá
    └── sfx_ding.wav          # Tiếng ting khi nhấn mạnh con số
```

---

## Cách cài đặt cho người nhận

### 1. Dùng với Antigravity
Copy cả thư mục `tao_video99` vào thư mục skills:
- **Windows:** `C:\Users\<TenUser>\.gemini\config\skills\tao_video99`
- **macOS / Linux:** `~/.gemini/config/skills/tao_video99`

### 2. Dùng với Claude Code
Copy cả thư mục `tao_video99` vào:
- `~/.claude/skills/tao_video99` (dùng toàn cục) hoặc `.claude/skills/tao_video99` (trong project).

### Yêu cầu môi trường khi render
- **Node.js** (để chạy `remotion`, `@remotion/cli`, `@remotion/captions`, `@remotion/media`, `@remotion/three`, `three`, `@react-three/fiber`)
- **Python 3** (với `SpeechRecognition` và `opencv-python` để tách lời thoại & kiểm tra khung hình)

---

## Cách dùng
Sau khi cài skill, chỉ cần nhắn cho AI Agent:
> *"Dùng skill `tao_video99` edit video trong thư mục `...`"*
hoặc:
> *"Dùng skill `tao_video99` lên kịch bản quay cho biển `30M-622.66` / SIM `09xx.xxx.555`"*
