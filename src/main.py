from ultralytics import YOLO
import cv2

from gpiozero import DistanceSensor
import time



# Load the YOLO model
model = YOLO("checkpoints/yolo10s_trained1.pt")
# Start video capture
cap = cv2.VideoCapture(0)  # Use 0 for the default webcam

# US is short for Ultrasonic Sensor
US = DistanceSensor(echo=17, trigger=4)
# Set the threshold distance to 0.5 meter
US.threshold_distance = 0.5
# Set the max distance to 1 meters
US.max_distance = 1

# Telegram messaging setup

while True:
    # EXIT CONDITION
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    # Wait for the ultrasonic sensor to detect an object within range of 0.5 to 1 meter
    if US.wait_for_in_range():

        # Display camera feed
        ret, frame = cap.read()
        if not ret:
            break

        # Wait 3 seconds
        time.sleep(3)

        # Capture the next 10 frames
        for i in range(10):
            ret, frame = cap.read()
            if not ret:
                break
            resized_frame = cv2.resize(frame, (320, 320))

            # Run inference
            results = model(resized_frame, stream=True)

            # Display the frame with the highest confidence of "Human"
            for result in results:
                for detection in result:
                    if detection[5] == "Human":
                        annotated_frame = result.plot()
                        cv2.imshow("YOLO Detection", annotated_frame)
                        break
            


# Release resources
cap.release()
cv2.destroyAllWindows()