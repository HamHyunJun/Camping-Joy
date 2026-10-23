export interface ConfirmOptions {
  title: string
  /** 줄바꿈(\n)은 그대로 보인다. */
  message?: string
  confirmLabel?: string
  /** 되돌릴 수 없는 작업이면 확인 버튼을 붉게 보여 준다. */
  danger?: boolean
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

interface UseConfirm {
  /** 지금 떠 있는 확인창. 없으면 undefined */
  request: Ref<ConfirmRequest | undefined>
  /** 확인창을 띄우고, 확인하면 true 취소하면 false를 돌려준다. */
  ask: (options: ConfirmOptions) => Promise<boolean>
  /** 확인창을 닫으며 답한다. app.vue의 확인창이 부른다. */
  answer: (ok: boolean) => void
}

/** 브라우저 기본 confirm() 대신 쓰는 확인창. 화면에는 app.vue의 ConfirmModal이 하나만 떠 있다. */
export const useConfirm = (): UseConfirm => {
  const request = useState<ConfirmRequest | undefined>('confirm-request')

  const ask = (options: ConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => {
      // 이미 떠 있는 확인창은 취소로 닫는다.
      request.value?.resolve(false)
      request.value = { ...options, resolve }
    })

  const answer = (ok: boolean): void => {
    request.value?.resolve(ok)
    request.value = undefined
  }

  return { request, ask, answer }
}
