import { screen } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bill from "../containers/Bills.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import Router from "../app/Router";
import Firestore from "../app/Firestore";
import userEvent from "@testing-library/user-event"
import firebase from "../__mocks__/firebase.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() });

      // Créer la valeur de la route
      const pathName = ROUTES_PATH['Bills'];

      // Simulation l'adresse du navigateur
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
      expect(Array.from(screen.getByTestId('icon-window').classList).includes('active-icon')).toBe(true)
     })
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      //console.log(dates)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe("When I am on Bills Page and I click on New Bill", () => {
    test("Then, I should be sent on New Bill page", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      const user = JSON.stringify({
        type: 'Employee'
      })
      window.localStorage.setItem('user', user)
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const firestore = null
      const bill = new Bill({
        document, onNavigate, firestore, bills, localStorage: window.localStorage
      })

      const newBillBtn = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e))
      newBillBtn.addEventListener('click', handleClickNewBill);

      userEvent.click(newBillBtn)
      expect(handleClickNewBill).toHaveBeenCalled()
    })
  })
  describe("When I am on Bills Page and I click on Eye Icon", () => {
    test("Then ...", () => {
      $.fn.modal = jest.fn();
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      const user = JSON.stringify({
        type: 'Employee'
      })
      window.localStorage.setItem('user', user)
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const firestore = null
      const bill = new Bill({
        document, onNavigate, firestore, bills, localStorage: window.localStorage
      })

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(bill.handleClickIconEye)
      iconEye.addEventListener('click', (e) => handleClickIconEye(iconEye));

      userEvent.click(iconEye)
      expect(handleClickIconEye).toHaveBeenCalledTimes(1)
      expect(handleClickIconEye).toHaveBeenCalledWith(iconEye)
    })
  })
})


// Test d'Intégration GET
describe("Given I am user connected as Employee", () => {
  describe('When I navigate to Bills', () => {
    test("Fetchs bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get")
      const bills = await firebase.get()
      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(bills.data.length).toBe(4)
    })

    test("Fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      document.body.innerHTML = BillsUI({ error: "Erreur 404" })
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("Fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      document.body.innerHTML = BillsUI({ error: "Erreur 500" })
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})