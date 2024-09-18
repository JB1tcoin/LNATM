import RPi.GPIO as GPIO
import time

# GPIO-Nummerierung
GPIO.setmode(GPIO.BCM)

# GPIO-Pins für die Solenoids
SOLENOID_PIN = 17

# Pin
GPIO.setup(SOLENOID_PIN, GPIO.OUT)

try:
    # Solenoid 2 Sekunden aktivieren
    GPIO.output(SOLENOID_PIN, GPIO.HIGH)
    time.sleep(2)
    GPIO.output(SOLENOID_PIN, GPIO.LOW)
finally:
    GPIO.cleanup()
