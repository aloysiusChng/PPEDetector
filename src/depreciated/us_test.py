import RPi.GPIO as GPIO
import time

# Pin Definitions (BCM)
TRIG = 17
ECHO = 4

def setup():
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(TRIG, GPIO.OUT)
    GPIO.setup(ECHO, GPIO.IN)
    GPIO.output(TRIG, False)
    time.sleep(2)

def get_distance():
    # Send 10us pulse to TRIG
    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    # Wait for ECHO to go HIGH (start time)
    while GPIO.input(ECHO) == 0:
        pulse_start = time.time()

    # Wait for ECHO to go LOW (end time)
    while GPIO.input(ECHO) == 1:
        pulse_end = time.time()

    # Calculate distance
    pulse_duration = pulse_end - pulse_start
    distance_cm = pulse_duration * 17150  # Sound speed = 34300 cm/s, divide by 2
    distance_cm = round(distance_cm, 2)
    return distance_cm

def loop():
    try:
        while True:
            distance = get_distance()
            print(f"Distance: {distance} cm")
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopped by user")
        GPIO.cleanup()

if __name__ == '__main__':
    print("\nSetting Up")
    setup()
    print("\nEntering main loop")
    loop()
