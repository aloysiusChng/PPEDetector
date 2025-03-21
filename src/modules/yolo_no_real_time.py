from ultralytics import YOLO
import cv2
import time

# Load the YOLO model
model = YOLO("checkpoints/yolo10s_trained1.pt")

# Start video capture
cap = cv2.VideoCapture(0)  # Use 0 for the default webcam

start_time = time.time()
inference_done = False

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break  # Exit if no frame is captured

    current_time = time.time()
    elapsed_time = current_time - start_time

    if elapsed_time < 5:
        # Display live feed for 5 seconds (no inference)
        cv2.imshow("YOLO Detection", frame)
    elif not inference_done:
        # Resize frame for YOLO input
        resized_frame = cv2.resize(frame, (320, 320))
        
        # Run inference on one frame
        results = model(resized_frame)

        # Process detection result
        annotated_frame = results[0].plot()  # Annotate detections on the frame

        # Show the result once
        cv2.imshow("YOLO Detection", annotated_frame)
        inference_done = True
    else:
        # Just keep displaying the annotated frame until 'q' is pressed
        cv2.imshow("YOLO Detection", annotated_frame)

    # Press 'q' to quit anytime
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
