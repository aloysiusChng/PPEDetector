from gpiozero import DistanceSensor
import time
  
# US is short for Ultrasonic Sensor
US = DistanceSensor(echo=17, trigger=4)

# Set the threshold distance to 1 meter
US.threshold_distance = 1

# Set the max distance to 2 meters
US.max_distance = 2

# testing the ultrasonic sensor
def hello():
    print("Hello")

def bye():
    print("Bye")

US.when_in_range = hello()
US.when_out_of_range = bye()

while True:
    print(US.distance)
    time.sleep(1)