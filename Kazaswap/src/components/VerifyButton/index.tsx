import {useState} from 'react';
import auth from '../../api/auth';
import users from '../../api/users';
import useAuthentication from '../../hooks/useAuthentication';
import {ActivityIndicator, Pressable} from 'react-native';
import KText from '../KText';
import variables from '../../styles/variables';
import KIcon from '../KIcon/KIcon';
import {toastSuccess} from '../Toast/Toast';
import useIsMobile from '../../hooks/useIsMobile';

type Props = {
  type: 'email' | 'phone';
  onSent?: () => void;
};

export default (props: Props) => {
  const {user} = useAuthentication();
  const {isMobile} = useIsMobile();

  const verified =
    props.type === 'email' ? user?.emailVerified : user?.phoneVerified;
  const [status, setStatus] = useState<
    'none' | 'loading' | 'sent' | 'verified'
  >(verified ? 'verified' : 'none');
  const [text, setText] = useState<string>(
    isMobile ? 'Verify' : `Verify ${props.type}`,
  );

  const sendVerify = () => {
    if (!user) return;
    const origStatus = `${status}` as 'none' | 'loading' | 'sent' | 'verified';
    setStatus('loading');
    users.me
      .requestVerify(props.type)
      .then(s => {
        setText(isMobile ? 'Sent' : 'Verification message sent');
        toastSuccess(
          `Verification message sent, please check your ${props.type}`,
        );
        setStatus('sent');
        props.onSent && props.onSent();
      })
      .catch(e => {
        setStatus(origStatus);
      });
  };

  return (
    <Pressable
      onPress={sendVerify}
      disabled={status === 'loading' || status === 'sent' || verified}>
      <KText
        style={{
          borderWidth: 1,
          borderRadius: 20,
          marginLeft: verified ? 0 : 5,
          borderColor: verified ? "transparent": variables.colors.orange,
          backgroundColor: verified ? "transparent": variables.colors.orange,
          color: variables.colors.white,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 5,
        }}>
        {status === 'loading' ? (
          <ActivityIndicator color={variables.colors.white} />
        ) : verified ? (<>
          <KIcon name="tickWobbly" size="medium" /> 
          </>
        ) : (
          text
        )}
      </KText>
    </Pressable>
  );
};
