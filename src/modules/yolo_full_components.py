from ultralytics import YOLO
import cv2
import time

# Load the YOLO model
model = YOLO("checkpoints/yolo10s_trained1.pt")

# Define the list of required/expected objects
required_items = ["person", "helmet", "gloves"]  # Update based on your model classes

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

    # Define positioning guide rectangle
    box_width, box_height = 200, 400
    top_left = (w // 2 - box_width // 2, h // 2 - box_height // 2)
    bottom_right = (w // 2 + box_width // 2, h // 2 + box_height // 2)

    if elapsed_time < 5:
        # Display positioning guide
        overlay = frame.copy()
        cv2.rectangle(overlay, top_left, bottom_right, (0, 255, 0), 2)
        cv2.putText(overlay, "Stand Here", (top_left[0], top_left[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.imshow("YOLO Detection", overlay)

    elif not inference_done:
        # Run inference once
        resized_frame = cv2.resize(frame, (320, 320))
        results = model(resized_frame)
        annotated_frame = results[0].plot()

        # Get detected class names
        detected_classes = set()
        for box in results[0].boxes:
            cls_id = int(box.cls[0].item())
            class_name = model.names[cls_id]
            detected_classes.add(class_name)

        # Draw checklist on the frame
        checklist_x, checklist_y = 10, 30
        for item in required_items:
            status = "✓" if item in detected_classes else "✗"
            color = (0, 255, 0) if item in detected_classes else (0, 0, 255)
            text = f"{status} {item}"
            cv2.putText(annotated_frame, text, (checklist_x, checklist_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            checklist_y += 30

        inference_done = True
        cv2.imshow("YOLO Detection", annotated_frame)

    else:
        # Show the annotated frame with checklist
        cv2.imshow("YOLO Detection", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
