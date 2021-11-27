import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import userEvent from "@testing-library/user-event";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js"
import firebase from "../__mocks__/firebase.js";
import Router from "../app/Router";
import Firestore from "../app/Firestore";

const onNavigate = ((pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
})

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then, it should render input elements", () => {
      // Génération de l'interface      
      const html = NewBillUI()
      document.body.innerHTML = html

      const inputType = screen.getByTestId('expense-type');
      const inputName = screen.getByTestId('expense-name');
      const inputDate = screen.getByTestId('datepicker');
      const inputAmount = screen.getByTestId('amount');
      const inputVat = screen.getByTestId('vat');
      const inputPct = screen.getByTestId('pct');
      const inputCommentary = screen.getByTestId('commentary');
      const inputFile = screen.getByTestId('file');

      expect(inputType && inputName && inputDate && inputAmount && inputVat && inputPct && inputCommentary && inputFile).toBeTruthy();
    })
    test("Then mail icon in vertical layout should be highlighted", () => {
      // Créer la valeur de la route
      const pathName = ROUTES_PATH['NewBill'];

      // Simulation de l'adresse du navigateur
      Object.defineProperty(window, 'location', {value: {hash: pathName}})

      // Connecté en tant qu'employé
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      const user = JSON.stringify({
        type: 'Employee'
      })
      window.localStorage.setItem('user', user)

      // Création du point d'entrée et fonctionnement du Rooter
      document.body.innerHTML = `<div id="root"></div>`;
      Router();

      // Test
      expect(Array.from(screen.getByTestId('icon-mail').classList).includes('active-icon')).toBe(true)
    })
  })

  describe("When I am on NewBill Page and I click on File button", () => {
    test("Then, if I enter a correct file, the file should be load correctly", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      const user = JSON.stringify({
        type: 'Employee'
      })
      window.localStorage.setItem('user', user)

      document.body.innerHTML = NewBillUI()
      const newBill = new NewBill({
        document, onNavigate, firestore: null, localStorage: window.localStorage
      })
      const handleChangeFile = jest.fn(newBill.handleChangeFile)

      const inputFile = screen.getByTestId('file');
      inputFile.addEventListener('change', handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["helloWorld.jpg"], "helloWorld.jpg", { type: "text/jpg"} )]
        }
      })
      
      expect(inputFile.files[0]).toStrictEqual(new File(["helloWorld.jpg"], "helloWorld.jpg", { type: "text/jpg"} ))
      expect(inputFile.files[0].name).toBe('helloWorld.jpg');
      expect(screen.getByTestId('file-error-message').textContent).toBe('');
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files.length).toEqual(1)
    })

    test("Then, if I enter a wrong file, it should display an error message", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      const user = JSON.stringify({
        type: 'Employee'
      })
      window.localStorage.setItem('user', user)

      document.body.innerHTML = NewBillUI()
      const newBill = new NewBill({
        document, onNavigate, firestore: null, localStorage: window.localStorage
      })
      const handleChangeFile = jest.fn(newBill.handleChangeFile)

      const inputFile = screen.getByTestId('file');
      inputFile.addEventListener('change', handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["helloWorld.gif"], "helloWorld.gif", { type: "text/gif"} )]
        }
      })
      
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0]).toStrictEqual(new File(["helloWorld.gif"], "helloWorld.gif", { type: "text/gif"} ))
      expect(inputFile.value).toBe('')
      expect(screen.getByTestId('file-error-message').textContent).toBe('Le justificatif doit être un fichier .jpg, .jpeg ou .png.');
    })
  })

  describe("When I am on NewBill Page and I click on the Submit Button", () => {
    test("Then it should create a correct new bill", () => {
      document.body.innerHTML = NewBillUI()
      const newBill = new NewBill({
        document, onNavigate, firestore: null, localStorage: window.localStorage
      })

      const form = screen.getByTestId('form-new-bill');
      const billExample = {
        type: "Transport",
        name: "Ticket de train",
        amount: 35,
        date: '2021-11-22',
        vat: 20,
        pct: 20,
        fileUrl: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fcommons.wikimedia.org%2Fwiki%2FFile%3AHelloWorld.svg&psig=AOvVaw1aZPwDC9CEVk8VdcrZ_iB8&ust=1637681943396000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCLiP8OimrPQCFQAAAAAdAAAAABAD',
        fileName: 'hello-world.jpg'
      }

      const handleSubmit = jest.fn(newBill.handleSubmit)
      
      newBill.createBill = (newBill) => newBill 
      document.querySelector('select[data-testid="expense-type"]').value = billExample.type;
      document.querySelector('input[data-testid="expense-name"]').value = billExample.name;
      document.querySelector('input[data-testid="datepicker"]').value = billExample.date;
      document.querySelector('input[data-testid="amount"]').value = billExample.amount;
      document.querySelector('input[data-testid="vat"]').value = billExample.vat;
      document.querySelector('input[data-testid="pct"]').value = billExample.pct;
      newBill.fileUrl = billExample.fileUrl;
      newBill.fileName = billExample.fileName;

      form.addEventListener('click', handleSubmit);
      fireEvent.click(form);

      expect(handleSubmit).toHaveBeenCalled();
    })
  })
})

// Test d'Intégration POST
describe("Given I am user connected as Employee", () => {
  describe('When I create a new bill', () => {
    test("Add bill to mock API", async () => {
      const postSpy = jest.spyOn(firebase, "post")

      const newBill = {
        "id": "BeKy5Mo4jkmdfPGYpTxZ",
        "vat": "",
        "amount": 100,
        "name": "test1",
        "fileName": "1592770761.jpeg",
        "commentary": "plop",
        "pct": 20,
        "type": "Transports",
        "email": "a@a",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…61.jpeg?alt=media&token=7685cd61-c112-42bc-9929-8a799bb82d8b",
        "date": "2001-01-01",
        "status": "refused",
        "commentAdmin": "en fait non"
      }
      const bills = await firebase.post(newBill)

      expect(postSpy).toHaveBeenCalledTimes(1)
      expect(bills.data.length).toBe(1)
    })
  })
})