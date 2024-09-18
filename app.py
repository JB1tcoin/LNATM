import backend
import time
import sys

def main():
    # LNURL withdraw link erstellen
    lnurl_data = backend.create_withdraw_link("Lightning ATM Withdrawal", 10, uses=1, wait_time=5)

    if lnurl_data:
        # QR code generieren und ans frontend senden
        qr_code_path = backend.generate_qr_code(lnurl_data['lnurl'])
        print(qr_code_path)  # qrcode path zu Electron
        sys.stdout.flush()   # instant nachricht

        # withdrawal check während countdown
        claimed = False
        for i in range(45, 0, -1):
            # Check ob withdrawal geclaimed
            if backend.check_withdrawal_claimed(lnurl_data['id']):
                print("claimed")  # claim erfolgsmessage
                sys.stdout.flush()
                backend.deposit_money()  
                claimed = True
                break  # Stop timer loop

            # timer update zu electron frontend
            print(f"timer: {i}s")
            sys.stdout.flush()
            time.sleep(1)

        if not claimed:
            print("timeout")  # message wenn timeout
            sys.stdout.flush()
            backend.return_money()  # geld zurück
    else:
        print("Error creating withdraw link.")
        sys.stdout.flush()

if __name__ == "__main__":
    main()

