from ultralytics import YOLO
import cv2

from gpiozero import DistanceSensor
import time

import os
import asyncio
from telegram import Bot
from dotenv import load_dotenv

# YOLO Set up
model = YOLO("checkpoints/yolo10s_trained1.pt")
# Start video capture
cap = cv2.VideoCapture(0)  # Use 0 for the default webcam

# US (Ultrasonic) Set up
US = DistanceSensor(echo=4, trigger=17)
# Set the threshold distance to 1.5 meter
US.threshold_distance = 1.5
# Set the max distance to 2 meters
US.max_distance = 2

# Telegram Set up
load_dotenv()
bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
chat_id = os.getenv("TELEGRAM_CHAT_ID")

# Define expected items
required_items = ["person", "helmet", "gloves"]
inference_done = False
start_time = time.time()

def telegram_message(message):
    """
    Sends a message to a Telegram chat using the Telegram bot.
    """
    print("Sending Alert to Telegram: ", message)
    asyncio.run(bot.send_message(chat_id=chat_id, text=message))

def open_camera():
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        return frame

    current_time = time.time()
    elapsed_time = current_time - start_time

    # Get dimensions
    h, w, _ = frame.shape

    # Define central guide box
    box_width, box_height = 200, 400
    top_left = (w // 2 - box_width // 2, h // 2 - box_height // 2)
    bottom_right = (w // 2 + box_width // 2, h // 2 + box_height // 2)

    if elapsed_time < 5:
        # Show guide with countdown
        overlay = frame.copy()
        cv2.rectangle(overlay, top_left, bottom_right, (0, 255, 0), 2)
        cv2.putText(overlay, "Stand Here", (top_left[0], top_left[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        countdown = max(0, int(5 - elapsed_time) + 1)
        cv2.putText(overlay, f"Photo in: {countdown}s", (w - 250, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)
        cv2.imshow("YOLO Detection", overlay)

    elif not inference_done:
        # Add padding (e.g., 30%) around the guide box
        padding_x = int(box_width * 0.3)
        padding_y = int(box_height * 0.3)

        roi_x1 = max(0, top_left[0] - padding_x)
        roi_y1 = max(0, top_left[1] - padding_y)
        roi_x2 = min(w, bottom_right[0] + padding_x)
        roi_y2 = min(h, bottom_right[1] + padding_y)

        # Crop the ROI
        cropped_frame = frame[roi_y1:roi_y2, roi_x1:roi_x2]

        # Resize for YOLO input
        resized_frame = cv2.resize(cropped_frame, (320, 320))
        results = model(resized_frame)
        annotated_crop = results[0].plot()

        # Checklist logic
        detected_classes = set()
        for box in results[0].boxes:
            cls_id = int(box.cls[0].item())
            class_name = model.names[cls_id]
            detected_classes.add(class_name)

        # Add checklist overlay to cropped frame
        checklist_x, checklist_y = 10, 30
        for item in required_items:
            status = "✓" if item in detected_classes else "✗"
            color = (0, 255, 0) if item in detected_classes else (0, 0, 255)
            cv2.putText(annotated_crop, f"{status} {item}", (checklist_x, checklist_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            checklist_y += 30
        
        # Send Telegram alert if helmet is missing
        if "person" in detected_classes and "helmet" not in detected_classes:
            telegram_message("No helmet detected!")

        annotated_frame = annotated_crop
        inference_done = True
        cv2.imshow("YOLO Detection", annotated_crop)

    else:
        cv2.imshow("YOLO Detection", annotated_frame)

# MAIN LOOP
while cap.isOpened():
    # MAIN EXIT CONDITION
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    # Wait for the ultrasonic sensor to detect an object within range
    if US.wait_for_in_range():
        captureFlag = True
        print("Object detected within range")

        while captureFlag:
            open_camera()
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        
# Release resources
cap.release()
cv2.destroyAllWindows()