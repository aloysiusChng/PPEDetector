from ultralytics import YOLO
import cv2
from gpiozero import DistanceSensor
import time
import os
import asyncio
from telegram import Bot
from dotenv import load_dotenv

# --- Load environment and Telegram Bot ---
load_dotenv()
bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
chat_id = os.getenv("TELEGRAM_CHAT_ID")

# Set up asyncio event loop (Fix #4)
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

# --- YOLO model and constants ---
model = YOLO("checkpoints/yolo10s_trained1.pt")
required_items = ["person", "helmet", "gloves"]

# --- Camera ---
cap = cv2.VideoCapture(0)

# --- Ultrasonic Sensor ---
US = DistanceSensor(echo=4, trigger=17)
US.threshold_distance = 1.5
US.max_distance = 2

def telegram_message(message):
    print("Sending Alert to Telegram: ", message)
    loop.run_until_complete(bot.send_message(chat_id=chat_id, text=message))

def show_guide(frame, elapsed):
    h, w, _ = frame.shape
    box_width, box_height = 200, 400
    top_left = (w // 2 - box_width // 2, h // 2 - box_height // 2)
    bottom_right = (w // 2 + box_width // 2, h // 2 + box_height // 2)
    overlay = frame.copy()
    cv2.rectangle(overlay, top_left, bottom_right, (0, 255, 0), 2)
    countdown = max(0, int(5 - elapsed) + 1)
    cv2.putText(overlay, "Stand Here", (top_left[0], top_left[1] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(overlay, f"Photo in: {countdown}s", (w - 250, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)
    return overlay, top_left, bottom_right

def run_inference(frame, top_left, bottom_right):
    h, w, _ = frame.shape
    box_width = bottom_right[0] - top_left[0]
    box_height = bottom_right[1] - top_left[1]

    padding_x = int(box_width * 0.3)
    padding_y = int(box_height * 0.3)
    roi_x1 = max(0, top_left[0] - padding_x)
    roi_y1 = max(0, top_left[1] - padding_y)
    roi_x2 = min(w, bottom_right[0] + padding_x)
    roi_y2 = min(h, bottom_right[1] + padding_y)

    cropped_frame = frame[roi_y1:roi_y2, roi_x1:roi_x2]
    resized_frame = cv2.resize(cropped_frame, (320, 320))

    results = model(resized_frame)

    # Copy the original cropped frame for annotation
    annotated_crop = cropped_frame.copy()
    detected_classes = set()

    # Optional: Draw boxes manually if you want to show detections
    for box in results[0].boxes:
        cls_id = int(box.cls[0].item())
        class_name = model.names[cls_id]
        detected_classes.add(class_name)

        # Draw bounding box (optional visual aid)
        xyxy = box.xyxy[0].int().tolist()
        x1, y1, x2, y2 = xyxy
        cv2.rectangle(annotated_crop, (x1, y1), (x2, y2), (255, 255, 0), 2)
        cv2.putText(annotated_crop, class_name, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    # Checklist overlay (✓ or ✗ for each required item)
    checklist_x, checklist_y = 10, 30
    for item in required_items:
        status = "✓" if item in detected_classes else "✗"
        color = (0, 255, 0) if item in detected_classes else (0, 0, 255)
        cv2.putText(annotated_crop, f"{status} {item}", (checklist_x, checklist_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        checklist_y += 30

    missing_items = [item for item in required_items if item not in detected_classes]
    return annotated_crop, missing_items


# --- Display function (Fix #3) ---
def show_result_window(img, timeout=5):
    start = time.time()
    while time.time() - start < timeout:
        cv2.imshow("YOLO Detection", img)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

# --- Main loop ---
try:
    while True:
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

        print("Waiting for person...")
        US.wait_for_in_range()
        print("Person detected!")

        # Countdown with guide
        start_time = time.time()
        while time.time() - start_time < 5:
            ret, frame = cap.read()
            if not ret:
                continue
            elapsed = time.time() - start_time
            overlay, top_left, bottom_right = show_guide(frame, elapsed)
            cv2.imshow("YOLO Detection", overlay)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        # Capture final frame and run inference
        ret, final_frame = cap.read()
        if not ret:
            continue

        annotated, missing = run_inference(final_frame, top_left, bottom_right)
        show_result_window(annotated, timeout=5)  # Show detection result (Fix #3)

        if "person" in missing:
            print("No person detected. Skipping Telegram alert.")
        elif missing:
            telegram_message(f"PPE Missing: {', '.join(missing)}")
        else:
            print("All PPE present.")

        time.sleep(5)  # Cooldown (Final Suggestion #3)
        cv2.destroyAllWindows()

finally:
    print("Cleaning up...")
    cap.release()
    cv2.destroyAllWindows()
