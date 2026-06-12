import React, { useState, useRef, useEffect, type ChangeEvent } from 'react';

// Import các Components
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import CameraScreen from './components/CameraScreen';
import StatsDashboard from './components/StatsDashboard';
import BodyBackground from './assets/img/bodyBackground.jpg';

// Import các Hàm hỗ trợ
import { analyzeImageAI } from './services/aiService';
import type { Detection } from './services/aiService';
import { drawBoundingBoxes } from './utils/canvasHelper';

// Định nghĩa cấu trúc cho mỗi dòng lịch sử (log) nhận diện nông sản
interface LogItem {
  id: string; // ID duy nhất ngẫu nhiên
  name: string; // Tên nông sản nhận diện được (kèm theo nhãn Defect nếu hỏng)
  time: string; // Thời gian phát hiện (hh:mm:ss)
  frame: number; // Chỉ số khung hình lúc quét được
  isPass: boolean; // Trạng thái đạt chất lượng (true) hay bị lỗi/hỏng (false)
}

const App: React.FC = () => {
  // ==========================================
  // 1. KHAI BÁO STATE & REFS (QUẢN LÝ TRẠNG THÁI)
  // ==========================================

  // Trạng thái hệ thống: dòng thông báo phản hồi hiển thị trên bảng điều khiển
  const [status, setStatus] = useState<{
    text: string;
    type: 'idle' | 'loading' | 'active' | 'success' | 'error';
  }>({
    text: "Hệ thống sẵn sàng. Vui lòng chọn nguồn quét.",
    type: 'idle'
  });
  // Nguồn quét đang hoạt động: 'idle' (chờ), 'camera' (live webcam), 'image' (phân tích ảnh), 'video' (phân tích video)
  const [mode, setMode] = useState<string>("idle");

  // Độ tự tin tối thiểu (Confidence threshold) của YOLO, đồng bộ từ LocalStorage hoặc mặc định là 0.25 (25%)
  const [confidence, setConfidence] = useState<number>(() => {
    return parseFloat(localStorage.getItem('veg_ai_confidence') || '0.25');
  });
  // Địa chỉ API của Server Backend Python FastAPI (mặc định localhost cổng 8000)
  const [apiUrl] = useState<string>(() => {
    return localStorage.getItem('veg_ai_url') || 'http://localhost:8000/predict';
  });

  // Lưu trữ danh sách vật thể phát hiện được phục vụ hiển thị thống kê & vẽ bounding box
  const [activeDetections, setActiveDetections] = useState<Detection[]>([]);

  // Quản lý tab chế độ hiển thị: 'static' (Chụp tĩnh/Quét tay) hoặc 'conveyor' (Băng chuyền tự động)
  const [activeTab, setActiveTab] = useState<'static' | 'conveyor'>('static');
  const [sensorLineY, setSensorLineY] = useState<number>(50); // Vị trí vạch cảm biến đếm ảo (%)
  const [conveyorSpeed, setConveyorSpeed] = useState<number>(0.5); // Tốc độ băng chuyền m/s
  const [conveyorTotal, setConveyorTotal] = useState<number>(0); // Tổng số nông sản đếm được trên băng tải
  const [conveyorFresh, setConveyorFresh] = useState<number>(0); // Số lượng nông sản tươi đạt chuẩn
  const [conveyorRotten, setConveyorRotten] = useState<number>(0); // Số lượng nông sản hỏng/lỗi

  // Mảng chứa tối đa 20 dòng nhật ký nhận diện thời gian thực mới nhất
  const [logs, setLogs] = useState<LogItem[]>([]);

  // Refs liên kết trực tiếp tới thẻ HTML <video> và <canvas> trong Viewport
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Refs lưu trữ các biến quản lý luồng chạy ngầm giúp tránh kích hoạt re-render React liên tục
  const isRunning = useRef<boolean>(false); // Trạng thái hệ thống đang chạy quét hay đã dừng
  const isProcessing = useRef<boolean>(false); // Khóa ngăn chặn gửi trùng lặp yêu cầu API khi yêu cầu trước chưa trả về
  const animationFrameId = useRef<number | null>(null); // Quản lý ID của requestAnimationFrame để hủy vòng lặp khi dừng
  const streamRef = useRef<MediaStream | null>(null); // Lưu trữ stream webcam để giải phóng camera khi tắt
  const currentDetections = useRef<Detection[]>([]); // Bộ nhớ đệm lưu trữ danh sách nhận dạng mới nhất tránh lag giật đồ họa
  const previousPositions = useRef<Record<number, { x: number; y: number }>>({}); // Lưu vị trí (X, Y) khung hình trước của ID vật thể
  const countedIds = useRef<Set<number>>(new Set()); // Lưu tập hợp ID đã được đếm tránh đếm trùng

  // ==========================================
  // 2. HIỆU ỨNG TỰ ĐỘNG & ĐỒNG BỘ LOCAL STORAGE
  // ==========================================

  // Cập nhật độ tự tin tối thiểu khi thay đổi thanh trượt và lưu trữ lại Local Storage
  const updateConfidence = (val: number) => {
    setConfidence(val);
    localStorage.setItem('veg_ai_confidence', val.toString());
  };

  // Effect giải phóng tài nguyên (Camera, Stream, Animation Loop) khi component bị hủy (Unmount)
  useEffect(() => {
    return () => stopAll();
  }, []);

  // Chế độ băng tải sẽ đếm trực tiếp từ kết quả YOLOv11 tracking qua vạch ảo, không chạy bộ sinh ngẫu nhiên nữa


  // Effect cập nhật nhật ký hoạt động tự động khi phát hiện vật thể tĩnh (Webcam/Ảnh tải lên)
  useEffect(() => {
    if (activeTab === 'conveyor') return; // Chế độ băng chuyền được thiết lập log riêng ở trên
    if (activeDetections.length === 0) return;

    // Duyệt qua kết quả phát hiện từ AI để sinh log tương ứng
    const newLogs = activeDetections.map((det, index) => {
      const isRotten = det.label.toLowerCase().includes('rotten');
      const cleanName = det.label
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()); // Format đẹp tên nông sản (ví dụ: Fresh Apple)

      return {
        id: `${Date.now()}-${index}-${Math.random()}`,
        name: cleanName,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        frame: Math.floor(Math.random() * 200) + 100,
        isPass: !isRotten
      };
    });

    setLogs(prev => {
      const combined = [...newLogs, ...prev];
      return combined.slice(0, 20);
    });
  }, [activeDetections, activeTab]);

  // Reset toàn bộ thông số đếm nông sản và nhật ký trên băng tải
  const resetConveyorCounter = () => {
    setConveyorTotal(0);
    setConveyorFresh(0);
    setConveyorRotten(0);
    setLogs([]);
    previousPositions.current = {};
    countedIds.current.clear();
  };

  // Hàm chụp ảnh màn hình canvas hiện tại (bao gồm khung hình gốc và bounding box vẽ đè)
  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png'); // Xuất Canvas thành chuỗi DataURL
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `detection_snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
    document.body.appendChild(link);
    link.click(); // Giả lập click chuột để tải ảnh về máy
    document.body.removeChild(link);
  };

  // ==========================================
  // 4. ĐIỀU KHIỂN LUỒNG CAMERA & MEDIA (XỬ LÝ DỮ LIỆU ĐẦU VÀO)
  // ==========================================

  // Hàm dừng toàn bộ các tác vụ quét: webcam stream, video play, vòng lặp animation và dọn dẹp canvas
  const stopAll = () => {
    isRunning.current = false;

    // Dừng webcam stream track
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Dừng phát video và xóa đường dẫn nguồn video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute('src');
    }

    // Hủy vòng lặp requestAnimationFrame đang chạy ngầm
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    setMode("idle");
    setStatus({ type: 'idle', text: "Quét đã dừng." });
    setActiveDetections([]);
    currentDetections.current = [];

    // Giải phóng bộ nhớ đệm theo vết
    previousPositions.current = {};
    countedIds.current.clear();

    // Xóa sạch hình vẽ cũ trên canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Hàm khởi động luồng truyền webcam trực tiếp
  const startCamera = async () => {
    stopAll(); // Dọn dẹp thiết bị cũ trước khi bật mới
    setStatus({ type: 'loading', text: "Đang khởi động camera..." });
    try {
      // Yêu cầu quyền truy cập Camera với độ phân giải lý tưởng 640x480 (phù hợp đầu vào YOLOv8 để xử lý nhanh)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        isRunning.current = true;
        setMode("camera");

        // Khi camera tải xong siêu dữ liệu hình ảnh, khởi tạo kích thước canvas và bắt đầu chạy vòng lặp nhận dạng liên tục
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            setStatus({ type: 'active', text: "Đang quét camera trực tiếp..." });
            videoRef.current.play();
            processContinuousFrame(); // Bắt đầu vòng lặp đồ họa quét khung hình gửi AI
          }
        };
      }
    } catch (err) {
      alert("Không tìm thấy Camera hoặc chưa được cấp quyền! Vui lòng kiểm tra lại thiết bị.");
      setStatus({ type: 'error', text: "Lỗi kích hoạt camera." });
      setMode("idle");
    }
  };

  // Xử lý khi người dùng chọn tải lên một bức ảnh tĩnh
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAll();
    setStatus({ type: 'loading', text: "Đang gửi ảnh phân tích AI..." });
    setMode("image");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        if (canvasRef.current) {
          // Co giãn canvas đúng bằng kích thước ảnh gốc tải lên
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            // Vẽ ảnh lên canvas nền
            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
            isRunning.current = true;
            // Trích xuất chuỗi base64 của ảnh tĩnh chất lượng cao gửi backend phân tích 1 lần duy nhất
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

  // Xử lý khi người dùng đăng tải một file Video để phân tích động
  const handleVideoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAll();
    setStatus({ type: 'loading', text: "Đang chuẩn bị video..." });
    setMode("video");

    const fileURL = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.src = fileURL;
      videoRef.current.load();

      // Tự động phát khi video đã nạp đủ dữ liệu ban đầu
      videoRef.current.oncanplay = () => {
        videoRef.current?.play().catch(err => console.error("Lỗi:", err));
      };

      videoRef.current.onloadedmetadata = () => {
        const MAX_WIDTH = 800; // Giới hạn chiều rộng hiển thị video tối đa để giảm tải xử lý đồ họa
        if (videoRef.current && canvasRef.current) {
          let ratio = 1;
          if (videoRef.current.videoWidth > MAX_WIDTH) {
            ratio = MAX_WIDTH / videoRef.current.videoWidth;
          }
          canvasRef.current.width = videoRef.current.videoWidth * ratio;
          canvasRef.current.height = videoRef.current.videoHeight * ratio;

          setStatus({ type: 'active', text: "Đang phân tích video..." });
          isRunning.current = true;
          processContinuousFrame(); // Bắt đầu chạy vòng lặp phân tích khung hình động của video
        }
      };

      // Tự động dừng và thông báo khi phát hết video
      videoRef.current.onended = () => {
        setStatus({ type: 'success', text: "Phát xong video!" });
        stopAll();
      };
    }
  };

  // ==========================================
  // 5. VÒNG LẶP ĐỒ HỌA & GỌI API AI (LUỒNG XỬ LÝ CHÍNH)
  // ==========================================

  // Hàm lặp đồ họa liên tục đồng bộ với tần suất làm tươi màn hình bằng requestAnimationFrame
  const processContinuousFrame = () => {
    if (!isRunning.current) return; // Dừng vòng lặp nếu hệ thống chuyển sang idle

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Đảm bảo video đang được phát ổn định
    if (video && canvas && !video.paused && !video.ended) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Bước 1: Vẽ khung hình hiện tại của video lên canvas làm hình nền thực tế
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Bước 2: Chụp ảnh hiện tại trên canvas chuyển thành base64 gửi AI phân tích (nếu API xử lý trước đó đã xong)
        // Cơ chế khóa isProcessing.current giúp tránh nghẽn luồng mạng khi fps của client cao hơn tốc độ phản hồi của backend
        if (!isProcessing.current) {
          isProcessing.current = true;
          const base64Image = canvas.toDataURL('image/jpeg', 0.8); // Giảm nhẹ chất lượng ảnh xuống 0.8 để truyền nhanh hơn
          handleFetchPredict(base64Image, false);
        }

        // Bước 3: Vẽ các hộp bounding box và nhãn chất lượng của các vật thể từ dữ liệu đệm nhận diện mới nhất
        drawBoundingBoxes(ctx, canvas, currentDetections.current);

        // Bước 4: Vẽ vạch đếm chéo màu đỏ dọc theo máng trượt (khi ở chế độ băng chuyền)
        if (activeTab === 'conveyor') {
          const x1 = canvas.width * 0.08;
          const y1 = canvas.height * 0.82;
          const x2 = canvas.width * 0.60;
          const y2 = canvas.height * 0.42;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = '#EF4444'; // Đường màu đỏ như mô tả
          ctx.lineWidth = 4;
          ctx.setLineDash([6, 6]); // Đường đứt nét
          ctx.stroke();
          ctx.setLineDash([]); // Khôi phục nét liền

          // Vẽ chữ nhãn vạch đếm
          ctx.fillStyle = '#EF4444';
          ctx.font = 'bold 14px system-ui, sans-serif';
          ctx.fillText('COUNT LINE', x2 + 10, y2);
        }
      }
    }

    // Tiếp tục đăng ký hàm chạy lại ở khung hình tiếp theo tạo hoạt ảnh liên tục mượt mà
    animationFrameId.current = requestAnimationFrame(processContinuousFrame);
  };

  // Hàm xử lý đếm sản phẩm băng tải thực tế dựa trên YOLOv11 tracker ID và vạch chéo ảo
  const processConveyorCounting = (detections: Detection[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Tọa độ vạch đếm chéo
    const x1 = canvas.width * 0.08;
    const y1 = canvas.height * 0.82;
    const x2 = canvas.width * 0.60;
    const y2 = canvas.height * 0.42;

    // Hàm xác định phía của điểm (x, y) so với đường thẳng đi qua (x1, y1) và (x2, y2)
    const getSide = (x: number, y: number) => {
      return (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
    };

    detections.forEach(det => {
      const id = det.id;
      // Chỉ đếm khi có ID hợp lệ từ YOLOv11 tracker
      if (id === undefined || id === null) return;

      const [rx1, ry1, rx2, ry2] = det.box;
      const centerX = (rx1 + rx2) / 2;
      const centerY = (ry1 + ry2) / 2;
      const prevPos = previousPositions.current[id];

      if (prevPos !== undefined) {
        const prevSide = getSide(prevPos.x, prevPos.y);
        const currSide = getSide(centerX, centerY);

        // Kiểm tra xem vật thể có cắt qua vạch chéo trong giới hạn trục X của vạch không
        const crossed = (prevSide * currSide < 0) && (centerX >= Math.min(x1, x2) && centerX <= Math.max(x1, x2));

        if (crossed && !countedIds.current.has(id)) {
          // Ghi nhận ID đã được đếm để không đếm trùng
          countedIds.current.add(id);

          const isRotten = det.label.toLowerCase().includes('rotten');
          const cleanName = det.label
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase()); // Format nhãn dạng CamelCase

          // Cập nhật bộ đếm
          setConveyorTotal(prev => prev + 1);
          if (isRotten) {
            setConveyorRotten(prev => prev + 1);
          } else {
            setConveyorFresh(prev => prev + 1);
          }

          // Thêm ghi nhận vào danh sách logs thời gian thực
          setLogs(prev => {
            const newLog: LogItem = {
              id: `${Date.now()}-${id}-${Math.random()}`,
              name: `${cleanName} #${id}`,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              frame: Math.floor(Math.random() * 200) + 100,
              isPass: !isRotten
            };
            return [newLog, ...prev].slice(0, 20); // Lưu giữ 20 dòng log mới nhất
          });
        }
      }

      // Cập nhật vị trí hiện tại
      previousPositions.current[id] = { x: centerX, y: centerY };
    });
  };

  // Hàm xử lý việc gọi API gửi ảnh sang Backend nhận kết quả
  const handleFetchPredict = async (base64Image: string, isStaticImage: boolean) => {
    // Gọi hàm phân tích truyền kèm API URL cấu hình và mức confidence đã thiết lập, cùng với cờ track (true khi ở tab conveyor)
    const result = await analyzeImageAI(base64Image, apiUrl, confidence, activeTab === 'conveyor');

    // Chốt chặn kiểm tra: Nếu trong quá trình fetch API kéo dài mà người dùng bấm dừng quét, bỏ qua kết quả này
    if (!isRunning.current) {
      isProcessing.current = false;
      return;
    }

    if (result.status === "success" && result.detections) {
      // Lưu kết quả nhận diện vào state activeDetections để đồng bộ UI (metrics, logs)
      setActiveDetections(result.detections);

      if (activeTab === 'conveyor') {
        // Thực hiện thuật toán đếm thực tế khi ở chế độ băng chuyền
        processConveyorCounting(result.detections);
      }

      if (isStaticImage && canvasRef.current) {
        // Đối với ảnh tĩnh vẽ một lần cố định duy nhất
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawBoundingBoxes(ctx, canvasRef.current, result.detections);
        }
        setStatus({ type: 'success', text: `Phân tích hoàn tất! Phát hiện ${result.detections.length} vật thể.` });
      } else {
        // Đối với camera/video trực tiếp, cập nhật vào biến ref đệm currentDetections để vẽ liên tục ở tần suất khung hình cao
        currentDetections.current = result.detections;
      }
    } else {
      // Báo lỗi nếu backend phản hồi lỗi hoặc không kết nối được
      if (isStaticImage) {
        setStatus({ type: 'error', text: "Phân tích thất bại. Không thể kết nối tới Backend!" });
      }
    }
    isProcessing.current = false; // Mở khóa cho phép gửi khung hình tiếp theo
  };

  // ==========================================
  // 6. LẮP RÁP BỐ CỤC DASHBOARD CHÍNH
  // ==========================================
  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden relative bg-cover bg-center bg-no-repeat transition-colors duration-300"
      style={{ backgroundImage: `url(${BodyBackground})` }}
    >
      {/* Background Overlay to ensure readability and support light/dark mode */}
      <div className="absolute inset-0 bg-bg-base/85 backdrop-blur-[2px] transition-colors duration-300 z-0"></div>

      {/* TOP HEADER BAR */}
      <div className="relative z-10">
        <Header />
      </div>

      {/* MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Static (Still Life) vs Conveyor (On the Belt) Mode Toggles */}
          <div className="flex bg-bg-muted rounded-md p-1 w-max border border-border-color">
            <button
              onClick={() => {
                setActiveTab('static');
                stopAll();
              }}
              className={`py-2 px-5 rounded-[10px] font-semibold text-[0.88rem] bg-transparent border-none cursor-pointer transition-all duration-200 ${activeTab === 'static' ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              Still Life
            </button>
            <button
              onClick={() => {
                setActiveTab('conveyor');
                stopAll();
              }}
              className={`py-2 px-5 rounded-[10px] font-semibold text-[0.88rem] bg-transparent border-none cursor-pointer transition-all duration-200 ${activeTab === 'conveyor' ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              On the Belt
            </button>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-[280px_1fr_320px]">
            <ControlPanel
              status={status}
              mode={mode}
              onStart={startCamera}
              onStop={stopAll}
              onImageUpload={handleImageUpload}
              onVideoUpload={handleVideoUpload}
              confidence={confidence}
              onConfidenceChange={updateConfidence}
              activeTab={activeTab}
              sensorLineY={sensorLineY}
              onSensorLineYChange={setSensorLineY}
              conveyorSpeed={conveyorSpeed}
              onConveyorSpeedChange={setConveyorSpeed}
            />

            <CameraScreen
              videoRef={videoRef}
              canvasRef={canvasRef}
              mode={mode}
              activeTab={activeTab}
              sensorLineY={sensorLineY}
              detections={activeDetections}
              conveyorTotal={conveyorTotal}
              conveyorFresh={conveyorFresh}
            />

            <StatsDashboard
              detections={activeDetections}
              onTakeSnapshot={takeSnapshot}
              mode={mode}
              activeTab={activeTab}
              conveyorTotal={conveyorTotal}
              conveyorFresh={conveyorFresh}
              conveyorRotten={conveyorRotten}
              onResetConveyor={resetConveyorCounter}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;