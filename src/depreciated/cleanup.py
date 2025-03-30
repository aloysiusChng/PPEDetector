# Save as cleanup.py and run with sudo
#import RPi.GPIO as GPIO
#GPIO.setmode(GPIO.BCM)
#GPIO.cleanup()

from gpiozero import DistanceSensor
ultrasonic = DistanceSensor(echo=4, trigger=17)
while True:
    print(ultrasonic.distance)