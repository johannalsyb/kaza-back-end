
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../../navigation/screens";
import Register from "../../components/forms/auth/Register";
import Onboarding, {onboardingSteps} from "../Onboarding";
import { useSetAtom } from "jotai";
import { showComponentAtom } from "../../atoms";
import VerifyPhone from "../../components/VerifyPhone";
import { toastSuccess } from "../../components/Toast/Toast";
import { User } from "@kazaswap/common";

type Props = NativeStackScreenProps<NavStackParamList, 'Onboarding'>;


export default (props:Props) => {

  const [setShowModalComponent] = [useSetAtom(showComponentAtom)];

  const onUserCreated = (user:Partial<User>) => {

    setShowModalComponent(<VerifyPhone onVerified={() => {
      toastSuccess("Phone verified successfully")
      setShowModalComponent(null)
    }} />)

    setTimeout(() => props.navigation.navigate("Onboarding", {step: 1}), 250)
  }

  onboardingSteps[0].content = <Register onCreated={onUserCreated}/>
  return <Onboarding navigation={props.navigation} route={props.route} />
}