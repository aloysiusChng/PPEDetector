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
US = DistanceSensor(echo=17, trigger=4)
# Set the threshold distance to 0.5 meter
US.threshold_distance = 0.5
# Set the max distance to 1 meters
US.max_distance = 1

# Telegram Set up
load_dotenv()
bot = Bot.token(os.getenv("TELEGRAM_BOT_TOKEN"))
chat_id = os.getenv("TELEGRAM_CHAT_ID")

def is_human_detected(result, target_label="Human"):
    """
    Checks if the specified label (default 'Human') is detected in the result.
    """
    boxes = result.boxes
    if boxes is None:
        return False

    for i in range(len(boxes)):
        cls_id = int(boxes.cls[i])
        label = model.names[cls_id]
        if label == target_label:
            return True
    return False

def display_annotated_frame(result):
    """
    Renders and displays the frame with detections.
    """
    annotated_frame = result.plot()
    cv2.imshow("YOLO Detection", annotated_frame)

# MAIN LOOP
while cap.isOpened():
    # MAIN EXIT CONDITION
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    # Wait for the ultrasonic sensor to detect an object within range of 0.5 to 1 meter
    if US.wait_for_in_range():

        if cap.isOpened():
            ret, frame = cap.read()
        else: 
            ret = False

        # Set duration in seconds
        duration = 5  # display for 10 seconds
        start_time = time.time()

        # Display the webcam feed for 5 seconds
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame")
                break

            # Show the frame in a window named 'Webcam'
            cv2.imshow('Webcam', frame)

            # Check if duration has passed
            if time.time() - start_time > duration:
                break
            
        # Close the window
        cv2.destroyAllWindows()

        # Capture the next 5 frames
        for i in range(5):
            ret, frame = cap.read()
            if not ret:
                break

            # Run inference
            results = model(frame, stream=True)

            # Display the frame with the highest confidence of "Human"
            for result in results:
                if is_human_detected(result):
                    display_annotated_frame(result)
                    break
            
                        


# Release resources
cap.release()
cv2.destroyAllWindows()