'use client';

import { HeaderSection } from '@/components/layout/header-section';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const comparisonData = [
  {
    feature: 'Text to Image Generation',
    roboneo: true,
    traditional: false,
    others: 'Limited',
  },
  {
    feature: 'Multiple Art Styles',
    roboneo: '100+',
    traditional: false,
    others: '10-20',
  },
  {
    feature: 'Speed',
    roboneo: 'Seconds',
    traditional: 'Hours/Days',
    others: 'Minutes',
  },
  {
    feature: 'Cost per Image',
    roboneo: 'Free/Low',
    traditional: 'High',
    others: 'Medium',
  },
  {
    feature: 'No Design Skills Required',
    roboneo: true,
    traditional: false,
    others: true,
  },
  {
    feature: 'Commercial License',
    roboneo: true,
    traditional: 'Varies',
    others: 'Extra Cost',
  },
  {
    feature: 'Batch Generation',
    roboneo: true,
    traditional: false,
    others: 'Limited',
  },
  {
    feature: 'API Access',
    roboneo: true,
    traditional: false,
    others: 'Premium Only',
  },
];

export default function TextToImageComparisonSection() {
  return (
    <section className="px-4 py-20 bg-white">
      <div className="mx-auto max-w-5xl">
        <HeaderSection
          title="How We Compare"
          titleAs="h2"
          subtitle="RoboNeo vs. Traditional Methods"
          subtitleAs="h3"
          subtitleClassName="text-2xl lg:text-3xl font-bold text-foreground"
          description="See why creators choose RoboNeo over traditional design methods and other AI platforms."
          descriptionAs="p"
          descriptionClassName="max-w-3xl text-lg text-muted-foreground"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-12 overflow-hidden rounded-2xl border border-border shadow-sm"
        >
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Feature
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-primary">
                  RoboNeo AI
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                  Traditional Design
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                  Other AI Tools
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparisonData.map((row, index) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {row.feature}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {typeof row.roboneo === 'boolean' ? (
                      row.roboneo ? (
                        <Check className="mx-auto h-5 w-5 text-green-500" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-red-500" />
                      )
                    ) : (
                      <span className="text-sm font-medium text-primary">
                        {row.roboneo}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {typeof row.traditional === 'boolean' ? (
                      row.traditional ? (
                        <Check className="mx-auto h-5 w-5 text-green-500" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-red-500" />
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {row.traditional}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {typeof row.others === 'boolean' ? (
                      row.others ? (
                        <Check className="mx-auto h-5 w-5 text-green-500" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-red-500" />
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {row.others}
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
