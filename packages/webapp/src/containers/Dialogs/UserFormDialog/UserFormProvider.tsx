// @ts-nocheck
import React, { createContext, useContext } from 'react';
import intl from 'react-intl-universal';
import {
  useEditUser,
  useUser,
  useRoles,
  useAuthenticatedAccount,
} from '@/hooks/query';

import { DialogContent } from '@/components';

const UserFormContext = createContext();

/**
 * User Form provider.
 */
function UserFormProvider({ userId, dialogName, ...props }) {
  //  edit user mutations.
  const { mutateAsync: EditUserMutate } = useEditUser();

  // fetch user detail.
  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useUser(userId, {
    enabled: !!userId,
  });

  // fetch roles list.
  const {
    data: roles,
    isLoading: isRolesLoading,
    isError: isRolesError,
  } = useRoles();

  // Retrieve authenticated user information.
  const { data: authAccountData } = useAuthenticatedAccount();

  const isEditMode = userId;
  const isLoading = isUserLoading || isRolesLoading;
  // Edit mode needs the user record to render safely; new-user mode doesn't.
  const isError = isRolesError || (isEditMode && (isUserError || !user));

  // `user` is still undefined on the very first render while the query
  // resolves — guard against it instead of crashing the whole dialog.
  const isAuth = !!user && user.system_user_id == authAccountData?.id;

  // Provider state.
  const provider = {
    isAuth,
    userId,
    dialogName,

    user,
    EditUserMutate,

    isEditMode,
    roles: roles || [],
  };

  if (isLoading) {
    return <DialogContent isLoading name={'user-form'}>{null}</DialogContent>;
  }
  if (isError) {
    return (
      <DialogContent isLoading={false} name={'user-form'}>
        <div style={{ padding: 20 }}>
          {intl.get('could_not_load_user_close_and_try_again')}
        </div>
      </DialogContent>
    );
  }
  return (
    <DialogContent isLoading={false} name={'user-form'}>
      <UserFormContext.Provider value={provider} {...props} />
    </DialogContent>
  );
}

const useUserFormContext = () => useContext(UserFormContext);

export { UserFormProvider, useUserFormContext };
