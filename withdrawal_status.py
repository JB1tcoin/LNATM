#
#
# Sollte eigentlich unnötig sein, da withdrawal status im frontend verankert.
#
#
#



import RPi.GPIO as GPIO
import time
import requests

# Konfiguration für GPIO
GPIO.setmode(GPIO.BCM)
SOLENOID_1_PIN = 17  # GPIO Pin für Solenoid 1
GPIO.setup(SOLENOID_1_PIN, GPIO.OUT)

admin_key = '0802d1a6fd744b1099b996809c038d63'  # Admin Key für LNbits
withdraw_url = 'https://demo.lnbits.com/withdraw/api/v1/links'

def create_withdraw_link(title, withdraw_amount, uses, wait_time):
    headers = {
        'X-Api-Key': admin_key,
        'Content-type': 'application/json'
    }
    data = {
        "title": title,
        "min_withdrawable": withdraw_amount,
        "max_withdrawable": withdraw_amount,
        "uses": uses,
        "wait_time": wait_time,
        "is_unique": True
    }
    try:
        response = requests.post(withdraw_url, json=data, headers=headers)
        if response.status_code == 201:
            return response.json()  # Rückgabe der LNURLw-Daten
        else:
            print("Error creating withdraw link:", response.json())
            return None
    except Exception as e:
        print("Exception occurred:", e)
        return None

# Funktion zur Überprüfung, ob die Auszahlung abgeholt wurde
def check_withdrawal_claimed(link_id):
    try:
        response = requests.get(f"https://demo.lnbits.com/withdraw/api/v1/links/{link_id}", headers={
            'X-Api-Key': admin_key
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("used") > 0  # Auszahlung erfolgreich, wenn "used" > 0
        else:
            print("Error checking withdrawal:", response.json())
            return False
    except Exception as e:
        print("Exception occurred:", e)
        return False

# Funktion zur Aktivierung des Solenoids
def activate_solenoid(pin):
    try:
        GPIO.output(pin, GPIO.HIGH)
        time.sleep(2)  # Solenoid für 2 Sekunden aktivieren
        GPIO.output(pin, GPIO.LOW)
    finally:
        GPIO.cleanup()

if __name__ == "__main__":
    # Beispielaufruf: Erstellt LNURLw und überprüft den Status
    withdraw_link = create_withdraw_link("Test Auszahlung", 1000, 1, 1)
    if withdraw_link:
        link_id = withdraw_link['id']
        print(f"LNURLw erstellt mit ID: {link_id}")
        print("Warten auf Auszahlung...")
        
        # Überprüfung, ob die Auszahlung erfolgreich war
        while True:
            if check_withdrawal_claimed(link_id):
                print("Auszahlung erfolgreich!")
                activate_solenoid(SOLENOID_1_PIN)  # Solenoid aktivieren
                break
            time.sleep(5)  # Überprüfe alle 5 Sekunden
