import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ password, showRequirements = true }: PasswordStrengthIndicatorProps) {
  // Password strength criteria
  const criteria = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // Calculate strength score (0-5)
  const score = Object.values(criteria).filter(Boolean).length;

  // Determine strength level
  const getStrength = () => {
    if (password.length === 0) return { label: '', color: 'bg-gray-200', textColor: 'text-gray-500' };
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' };
    if (score === 3) return { label: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-600' };
    if (score === 4) return { label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (score === 5) return { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
    return { label: '', color: 'bg-gray-200', textColor: 'text-gray-500' };
  };

  const strength = getStrength();
  const percentage = (score / 5) * 100;

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      {password.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs">Password Strength:</span>
            <span className={`text-xs font-semibold ${strength.textColor}`}>
              {strength.label}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${strength.color} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Requirements List */}
      {showRequirements && password.length > 0 && (
        <div className="space-y-1.5 text-xs">
          <p className="font-semibold text-gray-700">Requirements:</p>
          <div className="space-y-1">
            <RequirementItem met={criteria.length} text="At least 8 characters" />
            <RequirementItem met={criteria.lowercase} text="One lowercase letter" />
            <RequirementItem met={criteria.uppercase} text="One uppercase letter" />
            <RequirementItem met={criteria.number} text="One number" />
            <RequirementItem met={criteria.special} text="One special character (!@#$%...)" />
          </div>
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className={`flex items-center gap-1.5 ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? (
        <Check className="w-3 h-3 flex-shrink-0" />
      ) : (
        <X className="w-3 h-3 flex-shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
}
