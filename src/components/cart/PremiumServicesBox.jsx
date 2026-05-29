import { PREMIUM_SERVICE_LABELS } from '../../constants/premiumServices'

function PremiumServicesBox({ services, onChange }) {
  return (
    <div className="premium-services">
      <h4 className="premium-services__title">Premium Xizmatlar</h4>
      <p className="premium-services__subtitle">Ixtiyoriy — jami summaga qo‘shiladi</p>
      <div className="premium-services__list">
        {Object.values(PREMIUM_SERVICE_LABELS).map((service) => {
          const checked = Boolean(services[service.id])
          return (
            <label key={service.id} className={`premium-services__item ${checked ? 'premium-services__item--active' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(service.id, e.target.checked)}
              />
              <span className="premium-services__check" aria-hidden />
              <span className="premium-services__body">
                <span className="premium-services__name">{service.title}</span>
                <span className="premium-services__desc">{service.description}</span>
              </span>
              <span className="premium-services__fee">+${service.fee}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default PremiumServicesBox
