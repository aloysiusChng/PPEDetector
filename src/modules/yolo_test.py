from ultralytics import YOLO
import cv2

# Load the YOLO model
model = YOLO("checkpoints/yolo10s_trained1.pt")

# Start video capture
cap = cv2.VideoCapture(0)  # Use 0 for the default webcam

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break  # Exit if no frame is captured

    # Run inference
    results = model(frame)

    # Process each detection result
    for result in results:
        # Render results on the frame
        annotated_frame = result.plot()  # Correct method to draw boxes

        # Display the frame
        cv2.imshow("YOLO Detection", annotated_frame)

    # Exit on pressing 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()