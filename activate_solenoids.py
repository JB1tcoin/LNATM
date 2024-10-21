import RPi.GPIO as GPIO
import time

# Setze die GPIO-Nummerierung
GPIO.setmode(GPIO.BCM)

# Definiere die GPIO-Pins für die Solenoids
SOLENOID_1_PIN = 27
SOLENOID_2_PIN = 17

# Setze die Pins als Ausgänge
GPIO.setup(SOLENOID_1_PIN, GPIO.OUT)
GPIO.setup(SOLENOID_2_PIN, GPIO.OUT)

try:
    # Solenoids für 2 Sekunden aktivieren
    GPIO.output(SOLENOID_1_PIN, GPIO.HIGH)
    GPIO.output(SOLENOID_2_PIN, GPIO.HIGH)
    time.sleep(2)
    GPIO.output(SOLENOID_1_PIN, GPIO.LOW)
    GPIO.output(SOLENOID_2_PIN, GPIO.LOW)
finally:
    GPIO.cleanup()
