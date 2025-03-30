# PPEDetector - INF2009 Final Project
## Introduction
An Edge Deployed solution to ensuring personnel entering worksites are properly equipped with Personal Protective Equipment (PPE). An edge-deployed YOLO_v10s fine-tuned to detect Humans and PPE on a Raspberry Pi 400 attached with a web camera and a ultrasonic sensor to detect incoming humans and check for PPE. Logging each detection onto a cloud database (PostgreSQL on AWS RDS). If a violation is detected, a message will be sent out to a Telegram group to notify higher management of the violation and image evidence will be stored onto cloud database (S3 Bucket on AWS). 

## Group P1-3 Members
| Full Name | Student ID |
| ----------- | ----------- |
| NG WEI HERNG  | 2302854 |
| CHNG SONG HENG ALOYSIUS | 2302857 |
| HENG YU XIN | 2302786 |
| WONG KHIN FOONG | 2302728 |
| WONG JUN KAI | 2302765 |

# Required Devices
1 x Raspberry Pi 400 (And its dependecies, i.e. Power Adapter and Mouse for easy navigation)

1 x Web Camera 

1 x Monitor (Optional if viewing through secondary device connected via a Virtual Network Computing software like VNCViewer)

1 x HDMI to Micro HDMI Cable (Optional; Same condition as monitor)

1 x Breadboard

1 x Ultrasonic Sensor (HC-SR04)

1 x 1k Ω Resistor

1 x 2k Ω Resistor

Some Female to Female wires, Female to Male wires and Male to Male wires

## Connecting of Devices via USB and wires
1. Connect Web camera to any USB port of the Raspberry Pi 400.
2. Connect wires to breadboard and ultrasonic sensor as shown in circuit diagram below. 
<br><b>NOTE: The diagram shows a Raspberry Pi 4B instead. This was used because there is no model for the Raspberry Pi 400. The diagram also does not show the USB connections for other devices.</b>
<br><b>SECOND NOTE: Take note of the GPIO pin set up on the diagram (Refer to the second figure). The pins used in the circuit diagram and the pin layout are aligned. To clarify, the pins used are pin numbers 2 (5v), 7 (GPIO4), 11 (GPIO17) and 39 (GRND).</b>
<br>Figure 1: Circuit Diagram for connecting Ultrasonic Sensor to Raspberry Pi 400.
![Circuit Diagram](./images/Circuit%20Connection%20for%20Ultrasonic.png)
<br>Figure 2: Raspberry Pi 400 Pin Layout
![Raspberry Pi 400 Pin Layout](./images/Raspberry-pi-4-pinout.jpg)
Source: https://www.theelectronics.co.in/2021/02/raspberry-pi-400-full-pc-in-keyboard.html

# Initial Software Setup
## 1. Configuring Keys for API Call
Create a `.env` file to host your Telegram Bot Token, Telegram Group Chat ID and your preferred Device name (Refer to `.env-example` for format).

Create a `config.py` file to host your Flask API keys and your Amazon S3 bucket keys (Refer to `config-example.py` for format).

## 2. Installing Requirements
```bash
pip install -r requirements.txt
```

## 3. Setting up local Flask requirements
Enter the `src` folder and enter flask shell.
```bash
cd src
flask shell
```
When in the Flask shell: 
<br><b>NOTE: Please wait for `db.create_all()` to finish executing before using `exit()`.</b>
```
>>>from app.extensions import db
>>>db.create_all()
>>>exit()
```

# Running the Application
Position ultrasonic sensor and web camera so that it covers the entry point of the worksites.

Open 2 terminals, in the first terminal:
```bash
flask run
```
In the second terminal:
```bash
python src/main.py
```

# Changing Settings
Edit `main.py` to make changes depending on physical setup (E.g. Changing ultrasonic sensor detection range or toggling whether Bounding Boxes post-inference are to be shown)

List of Settings:
```python
# Full list of detectable PPE. Do not remove "person". All other PPE listed in this list will be considered as required. Edit as you see fit.
required_items = ["person", "ear", "ear-mufs", "face", "face-guard", "face-mask", "foot", "tool", "glasses", "gloves", "helmet", "hands", "head", "medical-suit", "shoes", "safety-suit", "safety-vest"]
# Set a value inbetween 0 and 1, excluding 0 and 1, to set the threshold for detection range for when to trigger capture.
US.threshold_distance = 0.75
# Set a value equal to the maximum distance (in meters) for the range of the ultrasonic sensor.
US.max_distance = 2
# Change between True or False to show bounding boxes of detected objects in the captured frame.
SHOW_BOUNDING_BOXES = True
```

# Dashboard Web Application
Refer to the `README.md` file inside the `safety-moitoring-dashboard` folder for further instructions.

# Contribution
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.