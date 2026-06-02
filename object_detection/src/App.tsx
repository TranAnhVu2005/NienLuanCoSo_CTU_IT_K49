import React, { useState, useRef, useEffect, type ChangeEvent } from 'react';
import "./App.css";

// Import các Components
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import CameraScreen from './components/CameraScreen';
import StatsDashboard from './components/StatsDashboard';

// Import các Hàm hỗ trợ
import { analyzeImageAI } from './services/aiService';
import type { Detection } from './services/aiService';
import { drawBoundingBoxes, getInfoForLabel } from './utils/canvasHelper';

interface HistoryItem {
  id: string;
  timestamp: string;
  label: string;
  confidence: number;
  type: 'fresh' | 'rotten';
  labelVi: string;
}

const App: React.FC = () => {
  // ==========================================
  // 1. KHAI BÁO STATE & REFS
  // ==========================================

  // Quản lý trạng thái thiết bị & kết nối
  const [status, setStatus] = useState<string>("Hệ thống sẵn sàng. Vui lòng chọn nguồn quét.");
  const [mode, setMode] = useState<string>("idle"); // 'idle', 'camera', 'image', 'video'
  const [pingStatus, setPingStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Quản lý tham số tùy chọn (lấy từ LocalStorage hoặc mặc định)
  const [confidence, setConfidence] = useState<number>(() => {
    return parseFloat(localStorage.getItem('veg_ai_confidence') || '0.25');
  });
  const [apiUrl, setApiUrl] = useState<string>(() => {
    return localStorage.getItem('veg_ai_url') || 'http://localhost:8000/predict';
  });

  // Quản lý kết quả nhận dạng & lịch sử
  const [activeDetections, setActiveDetections] = useState<Detection[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Refs liên kết tới các thẻ HTML
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Refs quản lý biến ngầm trong vòng lặp liên tục
  const isRunning = useRef<boolean>(false);
  const isProcessing = useRef<boolean>(false);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentDetections = useRef<Detection[]>([]);

  // ==========================================
  // 2. KẾT NỐI API & ĐỒNG BỘ LOCAL STORAGE
  // ==========================================

  // Tự động kiểm tra kết nối API khi khởi động hoặc đổi API URL
  useEffect(() => {
    checkPingBackend();
  }, [apiUrl]);

  // Cập nhật Local Storage khi cấu hình thay đổi
  const updateConfidence = (val: number) => {
    setConfidence(val);
    localStorage.setItem('veg_ai_confidence', val.toString());
  };

  const updateApiUrl = (url: string) => {
    setApiUrl(url);
    localStorage.setItem('veg_ai_url', url);
  };

  const checkPingBackend = async (urlToTest = apiUrl) => {
    setPingStatus('checking');
    try {
      // Tách lấy domain gốc để kiểm tra cổng chào
      const baseUrl = urlToTest.split('/predict')[0] || 'http://localhost:8000';
      const response = await fetch(baseUrl, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        setPingStatus('online');
      } else {
        setPingStatus('offline');
      }
    } catch (e) {
      setPingStatus('offline');
    }
  };

  // Tự động giải phóng camera/video khi đóng trình duyệt
  useEffect(() => {
    return () => stopAll();
  }, []);

  // ==========================================
  // 3. XỬ LÝ LỊCH SỬ NHẬN DẠNG & THỐNG KÊ
  // ==========================================

  // Thêm các quả quét được vào nhật ký lịch sử hệ thống (Chống trùng lặp 2 giây)
  const addToHistory = (detectionsList: Detection[]) => {
    if (detectionsList.length === 0) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    setHistory(prev => {
      let newItems = [...prev];
      detectionsList.forEach(det => {
        const info = getInfoForLabel(det.label.toString());
        const isRotten = info.labelVi.includes('hỏng') || det.label.toString().toLowerCase().includes('rotten');
        
        // Kiểm tra trùng lặp: Nếu cùng nhãn và được quét trong vòng 2 giây gần nhất, bỏ qua
        const isDuplicate = prev.slice(0, 8).some(item => {
          // Tính khoảng cách thời gian giữa 2 bản ghi
          const [h, m, s] = item.timestamp.split(':');
          const itemTime = new Date();
          itemTime.setHours(parseInt(h), parseInt(m), parseInt(s));
          const diffMs = Math.abs(now.getTime() - itemTime.getTime());
          
          return item.label === det.label && diffMs < 2000;
        });

        if (!isDuplicate) {
          newItems.unshift({
            id: Math.random().toString(36).substring(2, 9),
            timestamp: timeString,
            label: det.label.toString(),
            confidence: det.confidence,
            type: isRotten ? 'rotten' : 'fresh',
            labelVi: info.labelVi
          });
        }
      });
      return newItems.slice(0, 100); // Lưu trữ tối đa 100 dòng ghi gần nhất
    });
  };

  const clearHistory = () => {
    setHistory([]);
    setActiveDetections([]);
    currentDetections.current = [];
    if (canvasRef.current && (mode === 'image' || mode === 'idle')) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setStatus("Đã xóa toàn bộ dữ liệu nhật ký.");
  };

  // Xuất file CSV báo cáo kết quả quét nông sản
  const exportHistoryToCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['Ma_Ghi', 'Thoi_Gian', 'Nhan_Goc', 'Nhan_Viet', 'Do_Tin_Cay', 'Phan_Loai'];
    const rows = history.map(item => [
      item.id,
      item.timestamp,
      item.label,
      item.labelVi,
      `${Math.round(item.confidence * 100)}%`,
      item.type === 'fresh' ? 'Tuoi ngon' : 'Hu hong'
    ]);

    // Sử dụng BOM \uFEFF giúp Excel hiểu tiếng Việt UTF-8 không lỗi font
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao_cao_phat_hien_ai_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chụp canvas hiện tại (Bao gồm hình ảnh thực tế và khung bounding box vẽ đè)
  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `chup_nhan_dang_${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // 4. ĐIỀU KHIỂN LUỒNG CAMERA & MEDIA
  // ==========================================

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
    setStatus("Hệ thống đã dừng quét.");
    setActiveDetections([]);
    currentDetections.current = [];

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const startCamera = async () => {
    stopAll();
    setStatus("⏳ Đang khởi động camera trực tiếp...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 } } 
      });
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
      alert("Không tìm thấy Camera hoặc chưa được cấp quyền! Vui lòng kiểm tra lại thiết bị.");
      setStatus("❌ Lỗi kích hoạt camera.");
      setMode("idle");
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAll();
    setStatus("⏳ Đang gửi ảnh cho AI phân tích...");
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
            const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.85);
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
    setStatus("⏳ Đang chuẩn bị phân tích video...");
    setMode("video");

    const fileURL = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.src = fileURL;
      videoRef.current.load();

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

          setStatus("🎬 Đang phân tích Video...");
          isRunning.current = true;
          processContinuousFrame();
        }
      };

      videoRef.current.onended = () => {
        setStatus("✅ Đã phát hết video!");
        stopAll();
      };
    }
  };

  // ==========================================
  // 5. VÒNG LẶP ĐỒ HỌA & GỌI API
  // ==========================================

  const processContinuousFrame = () => {
    if (!isRunning.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && !video.paused && !video.ended) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Vẽ khung hình video gốc ra nền
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Chụp khung hình hiện tại gửi AI nhận dạng (Nếu hệ thống rảnh)
        if (!isProcessing.current) {
          isProcessing.current = true;
          const base64Image = canvas.toDataURL('image/jpeg', 0.8);
          handleFetchPredict(base64Image, false);
        }

        // Vẽ đè các hộp nhận dạng chất lượng
        drawBoundingBoxes(ctx, canvas, currentDetections.current);
      }
    }

    animationFrameId.current = requestAnimationFrame(processContinuousFrame);
  };

  const handleFetchPredict = async (base64Image: string, isStaticImage: boolean) => {
    // Gọi hàm phân tích truyền kèm API URL cấu hình và mức độ tự tin
    const result = await analyzeImageAI(base64Image, apiUrl, confidence);

    // Chốt chặn giải phóng: Nếu người dùng đã dừng quét trong lúc đang fetch, bỏ qua kết quả
    if (!isRunning.current) {
      isProcessing.current = false;
      return;
    }

    if (result.status === "success" && result.detections) {
      setActiveDetections(result.detections);
      addToHistory(result.detections);

      if (isStaticImage && canvasRef.current) {
        // Đối với ảnh tĩnh vẽ một lần cố định
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawBoundingBoxes(ctx, canvasRef.current, result.detections);
        }
        setStatus(`✅ Phân tích hoàn tất! Tìm thấy ${result.detections.length} nông sản.`);
      } else {
        // Đối với camera/video, cập nhật vào bộ nhớ đệm vẽ liên tục
        currentDetections.current = result.detections;
      }
    } else {
      if (isStaticImage) {
        setStatus("❌ Phân tích thất bại. Không kết nối được Backend!");
      }
    }
    isProcessing.current = false;
  };

  // ==========================================
  // 6. LẮP RÁP BỐ CỤC DASHBOARD CHÍNH
  // ==========================================
  return (
    <div className="flex flex-col min-h-screen text-slate-100 font-sans antialiased">
      <Header pingStatus={pingStatus} onCheckPing={() => checkPingBackend(apiUrl)} />
      
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Layout Grid 3 cột trên màn hình lớn */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
          
          {/* CỘT TRÁI (3/12): Bảng điều khiển & Cài đặt */}
          <section className="lg:col-span-3 flex flex-col gap-6">
            <ControlPanel
              status={status}
              mode={mode}
              onStart={startCamera}
              onStop={stopAll}
              onImageUpload={handleImageUpload}
              onVideoUpload={handleVideoUpload}
              confidence={confidence}
              onConfidenceChange={updateConfidence}
              apiUrl={apiUrl}
              onApiUrlChange={updateApiUrl}
            />
          </section>

          {/* CỘT GIỮA (6/12): Màn hình camera HUD */}
          <section className="lg:col-span-6 flex flex-col gap-4">
            <CameraScreen
              videoRef={videoRef}
              canvasRef={canvasRef}
              mode={mode}
            />
          </section>

          {/* CỘT PHẢI (3/12): Thống kê chất lượng & Lịch sử log */}
          <section className="lg:col-span-3">
            <StatsDashboard
              detections={activeDetections}
              history={history}
              onClearHistory={clearHistory}
              onExportCSV={exportHistoryToCSV}
              onTakeSnapshot={takeSnapshot}
              mode={mode}
            />
          </section>

        </div>
      </main>
    </div>
  );
};

export default App;