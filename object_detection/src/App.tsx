import React, { useState, useRef, useEffect, type ChangeEvent } from 'react';
import "./App.css";
// Import các Components (Các khối giao diện)
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import CameraScreen from './components/CameraScreen';

// Import các Hàm hỗ trợ (Logic)
import { analyzeImageAI } from './services/aiService';
import type { Detection } from './services/aiService';
import { drawBoundingBoxes } from './utils/canvasHelper';

const App: React.FC = () => {
  // ==========================================
  // 1. KHAI BÁO STATE & REFS (TYPESCRIPT)
  // ==========================================

  // State quản lý UI
  const [status, setStatus] = useState<string>("Hãy chọn một phương thức để bắt đầu...");
  const [mode, setMode] = useState<string>("idle"); // 'idle', 'camera', 'image', 'video'

  // Refs liên kết tới thẻ HTML
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Refs quản lý biến ngầm (Không làm giật lag giao diện)
  const isRunning = useRef<boolean>(false);
  const isProcessing = useRef<boolean>(false);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentDetections = useRef<Detection[]>([]);

  // ==========================================
  // 2. CÁC HÀM ĐIỀU KHIỂN LUỒNG HOẠT ĐỘNG
  // ==========================================

  // Tự động dọn dẹp khi tắt web
  useEffect(() => {
    return () => stopAll();
  }, []);

  const stopAll = () => {
    isRunning.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute('src');
    }

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    setMode("idle");
    setStatus("Đã dừng hoạt động.");
    currentDetections.current = [];

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const startCamera = async () => {
    stopAll();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        isRunning.current = true;
        setMode("camera");

        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            setStatus("🔴 Đang quét Camera trực tiếp...");
            videoRef.current.play();
            processContinuousFrame();
          }
        };
      }
    } catch (err) {
      alert("Lỗi camera! Vui lòng cấp quyền truy cập trong cài đặt trình duyệt.");
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAll();
    setStatus("⏳ Đang phân tích ảnh...");
    setMode("image");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
            isRunning.current = true;

            const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8);
            handleFetchPredict(base64Image, true);
          }
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAll();

    const fileURL = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.src = fileURL;
      videoRef.current.load();
      setMode("video");

      videoRef.current.oncanplay = () => {
        videoRef.current?.play().catch(err => console.error("Lỗi:", err));
      };

      videoRef.current.onloadedmetadata = () => {
        const MAX_WIDTH = 800;
        if (videoRef.current && canvasRef.current) {
          let ratio = 1;
          if (videoRef.current.videoWidth > MAX_WIDTH) {
            ratio = MAX_WIDTH / videoRef.current.videoWidth;
          }
          canvasRef.current.width = videoRef.current.videoWidth * ratio;
          canvasRef.current.height = videoRef.current.videoHeight * ratio;

          setStatus("🎬 Đang phân tích Video thời gian thực...");
          isRunning.current = true;
          processContinuousFrame();
        }
      };

      videoRef.current.onended = () => {
        setStatus("✅ Đã chạy hết Video!");
        stopAll();
      };
    }
  };

  // ==========================================
  // 3. VÒNG LẶP ĐỒ HỌA & GỌI API AI
  // ==========================================

  const processContinuousFrame = () => {
    if (!isRunning.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && !video.paused && !video.ended) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 3.1 Vẽ video gốc ra nền
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 3.2 Chụp ảnh gửi AI (Nếu hệ thống rảnh)
        if (!isProcessing.current) {
          isProcessing.current = true;
          const base64Image = canvas.toDataURL('image/jpeg', 0.8);
          handleFetchPredict(base64Image, false);
        }

        // 3.3 Vẽ đè khung nhận diện màu xanh lá lên trên
        drawBoundingBoxes(ctx, canvas, currentDetections.current);
      }
    }

    animationFrameId.current = requestAnimationFrame(processContinuousFrame);
  };

  const handleFetchPredict = async (base64Image: string, isStaticImage: boolean) => {
    const result = await analyzeImageAI(base64Image);

    // Chốt chặn: Nếu người dùng đã tắt cam, không vẽ kết quả cũ ra nữa
    if (!isRunning.current) {
      isProcessing.current = false;
      return;
    }

    if (result.status === "success" && result.detections) {
      if (isStaticImage && canvasRef.current) {
        // Vẽ 1 lần đối với ảnh tĩnh
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawBoundingBoxes(ctx, canvasRef.current, result.detections);
        }
        setStatus("✅ Phân tích hoàn tất!");
      } else {
        // Lưu vào trí nhớ đối với Camera/Video
        currentDetections.current = result.detections;
      }
    }
    isProcessing.current = false;
  };

  // ==========================================
  // 4. LẮP RÁP GIAO DIỆN CHÍNH
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <Header />
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Khu vực Bảng điều khiển (Chiếm 4/12 cột) */}
          <div className="lg:col-span-4">
            <ControlPanel
              status={status}
              mode={mode}
              onStart={startCamera}
              onStop={stopAll}
              onImageUpload={handleImageUpload}
              onVideoUpload={handleVideoUpload}
            />
          </div>

          {/* Khu vực Màn hình hiển thị (Chiếm 8/12 cột) */}
          <div className="lg:col-span-8 flex">
            <CameraScreen
              videoRef={videoRef}
              canvasRef={canvasRef}
              mode={mode}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;