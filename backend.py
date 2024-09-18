import RPi.GPIO as GPIO
import time
import sys
import json

# GPIO-Nummerierung
GPIO.setmode(GPIO.BCM)
COIN_ACCEPTOR_PIN = 22

# Pin als Eingang
GPIO.setup(COIN_ACCEPTOR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# Pulse-Timeout und Debounce-Zeit
PULSE_TIMEOUT = 1
DEBOUNCE_TIME = 0.1 # um zu verhindern, dass falsch gezählt wird

# Zuordnung von Pulsen zu coins
PULSE_TO_VALUE = {
    2: 0.05,  # 5 Cent
    3: 0.10,  # 10 Cent
    4: 0.20,  # 20 Cent
    5: 0.50,  # 50 Cent
    6: 1.00,  # 1 Euro
    7: 2.00  # 2 Euro
}

total_value = 0  # Gesamtsumme der erkannten coins

def count_pulses():
    pulse_count = 0
    start_time = time.time()

    while (time.time() - start_time) < PULSE_TIMEOUT:
        if GPIO.input(COIN_ACCEPTOR_PIN) == GPIO.LOW:
            pulse_count += 1
            time.sleep(DEBOUNCE_TIME)

    return pulse_count

def detect_coin():
    global total_value
    try:
        while True:
            if GPIO.input(COIN_ACCEPTOR_PIN) == GPIO.LOW:
                pulses = count_pulses()
                
                # wert ermitteln
                coin_value = PULSE_TO_VALUE.get(pulses, None)
                if coin_value:
                    total_value += coin_value
                    # Wert an das Frontend als JSON senden
                    output = json.dumps({"value": total_value})
                    print(output)
                    sys.stdout.flush()

                time.sleep(1)
    finally:
        GPIO.cleanup()

if __name__ == "__main__":
    detect_coin()
