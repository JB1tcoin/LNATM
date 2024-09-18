import RPi.GPIO as GPIO
import time

#GPIO-Nummerierung
GPIO.setmode(GPIO.BCM)
COIN_ACCEPTOR_PIN = 22

# Setze den Pin als Eingang
GPIO.setup(COIN_ACCEPTOR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# Pulse-Timeout und Debounce-Zeit
PULSE_TIMEOUT = 1  # Zeit, in der die Pulse gezählt werden
DEBOUNCE_TIME = 0.1  # 100 ms debounce

# Zuordnung von Pulsen zu Münzwerten
PULSE_TO_VALUE = {
    2: 0.05,  # 5 Cent
    3: 0.10,  # 10 Cent
    4: 0.20,  # 20 Cent
    5: 0.50,  # 50 Cent
    6: 1.00,  # 1 Euro
    7: 2.00  # 2 Euro
}

def count_pulses():
    pulse_count = 0
    start_time = time.time()

    while (time.time() - start_time) < PULSE_TIMEOUT:
        if GPIO.input(COIN_ACCEPTOR_PIN) == GPIO.LOW:
            pulse_count += 1
            print(f"Pulse erkannt! Aktuelle Anzahl Pulse: {pulse_count}")
            time.sleep(DEBOUNCE_TIME)  # Erhöhte Debounce-Zeit von 100 ms

    return pulse_count

def detect_coin():
    try:
        while True:
            if GPIO.input(COIN_ACCEPTOR_PIN) == GPIO.LOW:
                print("Münze erkannt, Pulse werden gezählt...")
                pulses = count_pulses()
                
                # Münzwert ermitteln
                coin_value = PULSE_TO_VALUE.get(pulses, None)
                if coin_value:
                    print(f"Münze erkannt: {coin_value}€")
                else:
                    print(f"Unbekannte Anzahl Pulse: {pulses}")

                time.sleep(1)  # Pause, um doppelte Münzsignale zu vermeiden
    finally:
        GPIO.cleanup()

if __name__ == "__main__":
    detect_coin()
