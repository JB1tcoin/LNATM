import backend
import time
import sys

def main():
    # Create an LNURL withdraw link
    lnurl_data = backend.create_withdraw_link("Lightning ATM Withdrawal", 10, uses=1, wait_time=5)

    if lnurl_data:
        # Generate and send the path to the QR code image
        qr_code_path = backend.generate_qr_code(lnurl_data['lnurl'])
        print(qr_code_path)  # Send the QR code image path to Electron
        sys.stdout.flush()   # Ensure the message is sent immediately

        # Countdown and check if withdrawal is claimed during the countdown
        claimed = False
        for i in range(45, 0, -1):
            # Check if the withdrawal is claimed
            if backend.check_withdrawal_claimed(lnurl_data['id']):
                print("claimed")  # Notify that the claim was successful
                sys.stdout.flush()
                backend.deposit_money()  # Deposit the money
                claimed = True
                break  # Stop the timer loop

            # Send the timer update to the frontend
            print(f"timer: {i}s")
            sys.stdout.flush()
            time.sleep(1)

        if not claimed:
            print("timeout")  # Notify that the claim timed out
            sys.stdout.flush()
            backend.return_money()  # Return the money
    else:
        print("Error creating withdraw link.")
        sys.stdout.flush()

if __name__ == "__main__":
    main()

