import requests
import sys
import time

admin_key = "0802d1a6fd744b1099b996809c038d63"

def check_withdrawal_claimed(link_id):
    try:
        response = requests.get(f"https://demo.lnbits.com/withdraw/api/v1/links/{link_id}", headers={
            'X-Api-Key': admin_key
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("used") > 0  # Withdrawal claimed if used > 0
        else:
            print("Error checking withdrawal:", response.json())
            return False
    except Exception as e:
        print("Exception occurred:", e)
        return False

if __name__ == "__main__":
    link_id = sys.argv[1]  # ID des Links aus den Argumenten
    print(f"Received link_id: {link_id}")  # Gebe die link_id aus zum checcken ob korrekt
    sys.stdout.flush()  # ausgabe instant

    while True:
        if check_withdrawal_claimed(link_id):
            print("claimed")
            sys.stdout.flush()  # Erfolgsnachricht ausgeben
            break
        else:
            print("not claimed")
        time.sleep(0.5)  # Warte 0,5sek, bevor erneut geprüft wird
