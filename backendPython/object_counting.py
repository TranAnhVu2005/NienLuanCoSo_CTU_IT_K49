import cv2

from ultralytics import solutions

import os
import sys

# Get absolute path to the video file
current_dir = os.path.dirname(os.path.abspath(__file__))
video_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(current_dir, "conveyYoutube.mp4")

cap = cv2.VideoCapture(video_path)
assert cap.isOpened(), "Error reading video file"

# Get video width, height, and FPS
w, h, fps = (int(cap.get(x)) for x in (cv2.CAP_PROP_FRAME_WIDTH, cv2.CAP_PROP_FRAME_HEIGHT, cv2.CAP_PROP_FPS))

# Custom diagonal line coordinates (matching the red line drawn on the green chute)
region_points = [
    (int(0.08 * w), int(0.82 * h)),  # Bottom-left of the green chute
    (int(0.60 * w), int(0.42 * h))   # Top-right of the green chute
]

# Video writer
video_writer = cv2.VideoWriter("object_counting_output.avi", cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

# Initialize object counter object
counter = solutions.ObjectCounter(
    show=True,  # display the output
    region=region_points,  # pass region points
    model="yolo26n.pt",  # model="yolo26n-obb.pt" for object counting with OBB model.
)

# Process video
while cap.isOpened():
    success, im0 = cap.read()

    if not success:
        print("Video frame is empty or processing is complete.")
        break

    results = counter(im0)

    # print(results)  # access the output

    video_writer.write(results.plot_im)  # write the processed frame.

cap.release()
video_writer.release()
cv2.destroyAllWindows()  # destroy all opened windows