import RPi.GPIO as GPIO
import time

# Setze die GPIO-Nummerierung
GPIO.setmode(GPIO.BCM)

# Definiere die GPIO-Pins für die Solenoids
SOLENOID_PIN = 27

# Setze den Pin als Ausgang
GPIO.setup(SOLENOID_PIN, GPIO.OUT)

try:
    # Solenoid für 2 Sekunden aktivieren
    GPIO.output(SOLENOID_PIN, GPIO.HIGH)
    time.sleep(2)
    GPIO.output(SOLENOID_PIN, GPIO.LOW)
finally:
    GPIO.cleanup()
