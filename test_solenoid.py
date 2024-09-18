import RPi.GPIO as GPIO
import time

# GPIO-Nummerierung
GPIO.setmode(GPIO.BCM)
SOLENOID_1_PIN = 17
SOLENOID_2_PIN = 27

# Pins als Ausgänge
GPIO.setup(SOLENOID_1_PIN, GPIO.OUT)
GPIO.setup(SOLENOID_2_PIN, GPIO.OUT)

def activate_solenoids():
    try:
        # Solenoid 1 aktivieren
        GPIO.output(SOLENOID_1_PIN, GPIO.HIGH)
        print("Solenoid 1 aktiviert")
        time.sleep(2)
        GPIO.output(SOLENOID_1_PIN, GPIO.LOW)

        # Solenoid 2 aktivieren
        GPIO.output(SOLENOID_2_PIN, GPIO.HIGH)
        print("Solenoid 2 aktiviert")
        time.sleep(2)
        GPIO.output(SOLENOID_2_PIN, GPIO.LOW)

    finally:
        GPIO.cleanup()  # GPIO-Zustand zurücksetzen

if __name__ == "__main__":
    activate_solenoids()

