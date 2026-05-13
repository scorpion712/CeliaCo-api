import { doc, getDoc } from "firebase/firestore/lite";
import { firebaseDB } from "../../config/firebase";

export const getCustomer = async () => {
  const customerRef = doc(
    firebaseDB,
    "customers",
    process.env.CUSTOMER_ID ?? ""
  );
  // const q = query(customerRef, where("id", "==", 'UGoSFKiX5QfFy8LnmUCE'));
  const docSnapshot = await getDoc(customerRef);
  // const customer = querySnapshot.docs[0].data();
  // console.log(customer);
  if (docSnapshot.exists())
    return {
      customer: docSnapshot.data().username,
      isTesting: docSnapshot.data().isTesting,
      initialDate: new Date(docSnapshot.data().initialDate.toDate()).setHours(0),
      endDate: new Date(docSnapshot.data().endDate.toDate()).setHours(0),
      lastPaymentDate: new Date(docSnapshot.data().lastPaymentDate.toDate()).setHours(0),
      lastPaymentValue: docSnapshot.data().lastPaymentValue,
    };

  return null;
};
