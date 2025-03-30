from ultralytics import YOLO
import cv2
import time

# Load the YOLO model
model = YOLO("checkpoints/yolo10s_trained1.pt")

# Start video capture
cap = cv2.VideoCapture(0)

start_time = time.time()
inference_done = False
annotated_frame = None

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    current_time = time.time()
    elapsed_time = current_time - start_time

    # Get frame dimensions
    h, w, _ = frame.shape

    # Define a rectangle in the center as a positioning guide
    box_width, box_height = 200, 400
    top_left = (w // 2 - box_width // 2, h // 2 - box_height // 2)
    bottom_right = (w // 2 + box_width // 2, h // 2 + box_height // 2)

    if elapsed_time < 7:
        # Show the live feed with positioning guide
        overlay = frame.copy()
        cv2.rectangle(overlay, top_left, bottom_right, (0, 255, 0), 2)
        cv2.putText(overlay, "Stand Here", (top_left[0], top_left[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.imshow("YOLO Detection", overlay)

    elif not inference_done:
        # Run YOLO inference on a resized frame
        resized_frame = cv2.resize(frame, (320, 320))
        results = model(resized_frame)
        annotated_frame = results[0].plot()
        inference_done = True
        cv2.imshow("YOLO Detection", annotated_frame)

    else:
        # Display the inference result
        cv2.imshow("YOLO Detection", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
